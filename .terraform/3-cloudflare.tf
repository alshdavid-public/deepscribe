data "aws_cloudfront_distribution" "s3_dist" {
  id = var.cloudfront_distribution_id
}

resource "cloudflare_record" "deepscribe" {
  zone_id = var.cloudflare_zone_id
  name    = var.project_name
  value   = aws_cloudfront_distribution.s3_distribution.domain_name
  type    = "CNAME"
  ttl     = 1
  proxied = true
}