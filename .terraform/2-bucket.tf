# The destination bucket
data "aws_s3_bucket" "web_static" {
  bucket = "alshdavid-web-com-davidalsh-static"
}

# Mapping mime types so the browser renders HTML/CSS correctly
locals {
  mime_types = {
    "html" = "text/html"
    "css"  = "text/css"
    "js"   = "application/javascript"
    "png"  = "image/png"
    "jpg"  = "image/jpeg"
  }
}

resource "aws_s3_object" "static_files" {
  for_each     = fileset("${path.module}/../dist", "**/*")

  bucket       = data.aws_s3_bucket.web_static.id 
  key          = "${var.project_name}/${each.value}"
  source       = "${path.module}/../dist/${each.value}"
  content_type = lookup(local.mime_types, element(split(".", each.value), length(split(".", each.value)) - 1), "application/octet-stream")
  etag         = filemd5("${path.module}/../dist/${each.value}")
}


# output "bucket_url" {
#   value = "http://${aws_s3_bucket_website_configuration.s3_website.website_endpoint}"
# }