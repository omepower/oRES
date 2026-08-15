from rest_framework import serializers

from .models import Gate


class GateSerializer(serializers.ModelSerializer):

    gate_type_display = serializers.CharField(
        source="get_gate_type_display",
        read_only=True,
    )

    class Meta:
        model = Gate

        fields = [
            "id",
            "name",
            "gate_type",
            "gate_type_display",
            "location",
            "is_primary",
            "is_active",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "gate_type_display",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):

        is_primary = attrs.get(
            "is_primary",
            getattr(
                self.instance,
                "is_primary",
                False,
            ),
        )

        if is_primary:

            queryset = Gate.objects.filter(
                is_primary=True,
            )

            if self.instance:
                queryset = queryset.exclude(
                    pk=self.instance.pk,
                )

            if queryset.exists():
                raise serializers.ValidationError(
                    {
                        "is_primary":
                            "Only one gate can be designated as the primary gate."
                    }
                )

        return attrs


class VisitorScanSerializer(
    serializers.Serializer
):

    invitation_code = serializers.UUIDField()

    gate = serializers.PrimaryKeyRelatedField(
        queryset=Gate.objects.filter(
            is_active=True
        )
    )


class VisitorTimeOutSerializer(
    serializers.Serializer
):

    visit_id = serializers.IntegerField()