from django.conf import settings
from praw import Reddit
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.routers import DefaultRouter
from rest_framework.serializers import ModelSerializer
from rest_framework.viewsets import ReadOnlyModelViewSet, ViewSet

from .models import Feed, Link
from .reddit import use_reddit

# pylint: disable=no-self-use
class SubmissionViewSet(ViewSet):
    def list(self, request: Request):
        username = request.query_params.get("user")

        def get_submissions(reddit: Reddit):
            hot = reddit.front.hot(limit=settings.REDDIT_TOP_SUBMISSIONS)
            return [{"id": s.id} for s in hot]

        results = use_reddit(request.user.profile, username, get_submissions)
        return Response(results)


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