from django.urls import path

from ..views.admin_bugs import (
    admin_bug_report_detail,
    admin_bug_reports,
    bug_report_create,
)
from ..views.user_bugs import (
    user_bug_report_detail,
    user_bug_reports,
)


urlpatterns = [
    path(
        "bug-reports/create/",
        bug_report_create,
        name="bug-report-create",
    ),
    path(
        "admin/bugs/",
        admin_bug_reports,
        name="admin-bug-reports",
    ),
    path(
        "admin/bugs/<int:bug_id>/",
        admin_bug_report_detail,
        name="admin-bug-report-detail",
    ),
    path(
        "user/bug-reports/",
        user_bug_reports,
        name="user-bug-reports",
    ),
    path(
        "user/bug-reports/<int:bug_id>/",
        user_bug_report_detail,
        name="user-bug-report-detail",
    ),
]