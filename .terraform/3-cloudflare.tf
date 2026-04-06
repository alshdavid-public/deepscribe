resource "cloudflare_record" "deepscribe" {
  zone_id = var.cloudflare_zone_id
  name    = var.project_name
  value   = "d2ffztt838w4th.cloudfront.net"
  type    = "CNAME"
  ttl     = 1
  proxied = true
}