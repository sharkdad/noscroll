from typing import Callable, List

from django.db.models import Subquery
from django_filters.rest_framework import FilterSet, NumberFilter
from praw import Reddit
from praw.models import Submission
from rest_framework.decorators import action
from rest_framework.pagination import CursorPagination
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.routers import DefaultRouter
from rest_framework.serializers import ModelSerializer, CharField
from rest_framework.viewsets import ReadOnlyModelViewSet, ViewSet

from .dao import SeenSubmissionDao
from .data import AppDetails, SubmissionResults
from .models import Feed, Link, SeenSubmission
from .reddit import get_multis, use_anon_reddit, use_oauth_reddit, get_submissions


# pylint: disable=no-self-use
class AppDetailsViewSet(ViewSet):
    permission_classes = [AllowAny]

    def list(self, request: Request):
        if request.user.is_authenticated:
            username = request.query_params.get("user")
            multis = list(use_oauth_reddit(request.user.profile, username, get_multis))
            reddit_users = sorted(request.user.profile.tokens.keys())
        else:
            multis = []
            reddit_users = []
        return Response(AppDetails(request.user.is_authenticated, reddit_users, multis))


ALLOWED_SORT = set(("hot", "top", "new", "rising", "controversial"))
ALLOWED_TIME = set(("all", "year", "month", "day", "hour"))


def get_submissions_listing(request: Request) -> Callable[[Reddit], List[Submission]]:
    subreddit = request.query_params.get("subreddit")
    after = request.query_params.get("after")
    multi_owner = request.query_params.get("multi_owner")
    multi_name = request.query_params.get("multi_name")
    sort = request.query_params.get("sort")
    time = request.query_params.get("time")

    sort = sort if sort in ALLOWED_SORT else "hot"

    if time:
        time = time if time in ALLOWED_TIME else "all"

    params = {}
    if after:
        params["after"] = f"t3_{after}"

    def get_results(reddit: Reddit) -> List[Submission]:
        def get_feed():
            if subreddit:
                return reddit.subreddit(subreddit)
            if multi_owner and multi_name:
                return reddit.multireddit(multi_owner, multi_name)
            return reddit.front

        listing = getattr(get_feed(), sort)
        args = (time,) if time else ()
        return list(listing(*args, limit=100, params=params))

    return get_results


def get_submissions_by_id(reddit_ids: str) -> Callable[[Reddit], List[Submission]]:
    def get_results(reddit: Reddit) -> List[Submission]:
        fullnames = (f"t3_{id}" for id in reddit_ids.split(","))
        return list(reddit.info(fullnames))

    return get_results


# pylint: disable=no-self-use
class SubmissionViewSet(ViewSet):
    permission_classes = [AllowAny]

    def list(self, request: Request):
        username = request.query_params.get("user")
        reddit_ids = request.query_params.get("reddit_ids")

        get_results = (
            get_submissions_by_id(reddit_ids)
            if reddit_ids
            else get_submissions_listing(request)
        )

        results = (
            use_oauth_reddit(request.user.profile, username, get_results)
            if request.user.is_authenticated
            else use_anon_reddit(get_results)
        )

        return Response(SubmissionResults(list(get_submissions(results))))

    @action(detail=False, methods=["put"])
    def mark_seen(self, request):
        if request.user.is_authenticated:
            ids = request.data.get("ids") or []
            SeenSubmissionDao.mark_seen(request.user.id, ids)
        return Response()


class LinkSerializer(ModelSerializer):
    id = CharField(source="reddit_id", read_only=True)

    class Meta:
        model = Link
        fields = (
            "id",
            "title",
            "posted_at",
            "subreddit",
            "score",
            "url",
            "permalink",
            "num_comments",
            "is_read",
            "is_saved",
            "embed",
        )


class FeedSerializer(ModelSerializer):
    class Meta:
        model = Feed
        fields = ("id", "name")


class LinkFilterSet(FilterSet):
    min_score = NumberFilter(field_name="score", lookup_expr="gte")

    class Meta:
        model = Link
        fields = ["feeds", "min_score"]


class LinkPagination(CursorPagination):
    page_size = 100
    cursor_query_param = "after"


class LinkViewSet(ReadOnlyModelViewSet):
    serializer_class = LinkSerializer
    filterset_class = LinkFilterSet
    pagination_class = LinkPagination
    ordering_fields = ("posted_at",)
    ordering = "-posted_at"

    def get_queryset(self):
        links = Link.objects.exclude(reddit_id=None)
        seen = SeenSubmission.objects.filter(user=self.request.user)
        return links.exclude(reddit_id__in=Subquery(seen.values("submission_id")))

    @action(detail=False, methods=["put"])
    def mark_read(self, request):
        ids = request.data.get("link_ids") or []
        self.queryset.filter(id__in=ids).update(is_read=True)
        return Response()


class FeedViewSet(ReadOnlyModelViewSet):
    queryset = Feed.objects.all()
    serializer_class = FeedSerializer


router = DefaultRouter()
router.register("app", AppDetailsViewSet, "App")
router.register("feeds", FeedViewSet)
router.register("links", LinkViewSet, "Link")
router.register("submissions", SubmissionViewSet, "Submission")