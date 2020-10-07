from praw import Reddit
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.routers import DefaultRouter
from rest_framework.serializers import ModelSerializer
from rest_framework.viewsets import ReadOnlyModelViewSet, ViewSet

from .dao import SeenSubmissionDao
from .models import Feed, Link
from .reddit import use_anon_reddit, use_oauth_reddit, get_submissions
from .utils import to_json

# pylint: disable=no-self-use
class SubmissionViewSet(ViewSet):
    permission_classes = [AllowAny]

    def list(self, request: Request):
        username = request.query_params.get("user")
        subreddit = request.query_params.get("subreddit")
        after = request.query_params.get("after")
        multi_owner = request.query_params.get("multi_owner")
        multi_name = request.query_params.get("multi_name")

        params = {}
        if after:
            params["after"] = f"t3_{after}"

        def get_results(reddit: Reddit):
            def get_feed():
                if subreddit:
                    return reddit.subreddit(subreddit)
                if multi_owner and multi_name:
                    return reddit.multireddit(multi_owner, multi_name)
                return reddit.front

            return get_submissions(reddit, get_feed().hot(limit=100, params=params))

        results = (
            use_oauth_reddit(request.user.profile, username, get_results)
            if request.user.is_authenticated
            else use_anon_reddit(get_results)
        )

        if request.user.is_authenticated:
            results_list = list(results)
            ids = (r.id for r in results_list)
            seen_ids = set(SeenSubmissionDao.get_seen_ids(request.user.id, ids))
            results = (r for r in results_list if r.id not in seen_ids)

        from json import loads

        return Response({"results": loads(to_json(results))})

    @action(detail=False, methods=["put"])
    def mark_seen(self, request):
        if request.user.is_authenticated:
            ids = request.data.get("ids") or []
            SeenSubmissionDao.mark_seen(request.user.id, ids)
        return Response()


class LinkSerializer(ModelSerializer):
    class Meta:
        model = Link
        fields = (
            "id",
            "reddit_id",
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


class LinkViewSet(ReadOnlyModelViewSet):
    queryset = Link.objects.exclude(reddit_id=None)
    serializer_class = LinkSerializer
    filterset_fields = ("is_read", "is_saved", "feeds")
    ordering_fields = ("posted_at", "score")

    @action(detail=False, methods=["put"])
    def mark_read(self, request):
        ids = request.data.get("link_ids") or []
        self.queryset.filter(id__in=ids).update(is_read=True)
        return Response()


class FeedViewSet(ReadOnlyModelViewSet):
    queryset = Feed.objects.all()
    serializer_class = FeedSerializer


router = DefaultRouter()
router.register("feeds", FeedViewSet)
router.register("links", LinkViewSet)
router.register("submissions", SubmissionViewSet, "Submission")