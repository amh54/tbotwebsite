from django.http import HttpResponse


def robots_txt(request):
    return HttpResponse(
        "User-agent: *\n"
        "Allow: /\n"
        "\n"
        "Sitemap: https://api.pvzhtbot.com/sitemap.xml\n",
        content_type="text/plain",
    )