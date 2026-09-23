from django.http import HttpResponse


def robots_txt(request):
    return HttpResponse(
        "User-agent: *\n"
        "Allow: /\n"
        "\n"
        "Sitemap: https://pvzhtbot.com/sitemap.xml\n",
        content_type="text/plain",
    )