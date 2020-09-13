from rest_framework.routers import DefaultRouter
from rest_framework.serializers import ModelSerializer
from rest_framework.viewsets import ReadOnlyModelViewSet

from .models import Link


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


class LinkViewSet(ReadOnlyModelViewSet):
    queryset = Link.objects.exclude(reddit_id=None)
    serializer_class = LinkSerializer
    filterset_fields = ("is_read", "is_saved")
    ordering_fields = ("posted_at", "score")


router = DefaultRouter()
router.register("links", LinkViewSet)