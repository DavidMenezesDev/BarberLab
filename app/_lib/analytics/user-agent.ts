const BOT =
  /bot|crawl|spider|slurp|headless|lighthouse|pingdom|uptime|monitor|curl|wget|python-requests|preview|facebookexternalhit/i

export const isBot = (ua: string) => !ua || BOT.test(ua)

export const parseUserAgent = (ua: string) => {
  const device = /ipad|tablet/i.test(ua)
    ? "Tablet"
    : /mobi|android|iphone/i.test(ua)
      ? "Mobile"
      : "Desktop"

  const browser = /edg\//i.test(ua)
    ? "Edge"
    : /opr\/|opera/i.test(ua)
      ? "Opera"
      : /samsungbrowser/i.test(ua)
        ? "Samsung Internet"
        : /chrome|crios/i.test(ua)
          ? "Chrome"
          : /firefox|fxios/i.test(ua)
            ? "Firefox"
            : /safari/i.test(ua)
              ? "Safari"
              : "Outro"

  const os = /windows/i.test(ua)
    ? "Windows"
    : /android/i.test(ua)
      ? "Android"
      : /iphone|ipad|ios/i.test(ua)
        ? "iOS"
        : /mac os/i.test(ua)
          ? "macOS"
          : /linux/i.test(ua)
            ? "Linux"
            : "Outro"

  return { device, browser, os }
}
