import { createCookieSessionStorage } from "@remix-run/server-runtime";
import { GitlabStrategy } from "../src";

export const GitlabTest = describe(GitlabStrategy, () => {
  const verify = jest.fn();
  const sessionStorage = createCookieSessionStorage({
    cookie: { secrets: ["s3cr3t"] },
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  test("should allow changing the scope", async () => {
    const strategy = new GitlabStrategy(
      {
        clientID: "CLIENT_ID",
        clientSecret: "CLIENT_SECRET",
        callbackURL: "https://example.app/callback",
        scope: ["email"],
      },
      verify
    );

    const request = new Request("https://example.app/auth/gitlab");

    try {
      await strategy.authenticate(request, sessionStorage, {
        sessionKey: "user",
      });
    } catch (error) {
      if (!(error instanceof Response)) throw error;
      const location = error.headers.get("Location");

      if (!location) throw new Error("No redirect header");

      const redirectUrl = new URL(location);

      expect(redirectUrl.searchParams.get("scope")).toBe("email");
    }
  });

  test("should have the default scope", async () => {
    const strategy = new GitlabStrategy(
      {
        clientID: "CLIENT_ID",
        clientSecret: "CLIENT_SECRET",
        callbackURL: "https://example.app/callback",
      },
      verify
    );

    const request = new Request("https://example.app/auth/gitlab");

    try {
      await strategy.authenticate(request, sessionStorage, {
        sessionKey: "user",
      });
    } catch (error) {
      if (!(error instanceof Response)) throw error;
      const location = error.headers.get("Location");

      if (!location) throw new Error("No redirect header");

      const redirectUrl = new URL(location);

      expect(redirectUrl.searchParams.get("scope")).toBe(
        ["read_user"].join(" ")
      );
    }
  });

  test("should correctly format the authorization URL", async () => {
    const strategy = new GitlabStrategy(
      {
        clientID: "CLIENT_ID",
        clientSecret: "CLIENT_SECRET",
        callbackURL: "https://example.app/callback",
      },
      verify
    );

    const request = new Request("https://example.app/auth/gilab");

    try {
      await strategy.authenticate(request, sessionStorage, {
        sessionKey: "user",
      });
    } catch (error) {
      if (!(error instanceof Response)) throw error;

      const location = error.headers.get("Location");

      if (!location) throw new Error("No redirect header");

      const redirectUrl = new URL(location);

      expect(redirectUrl.hostname).toBe("gitlab.com");
      expect(redirectUrl.pathname).toBe("/oauth/authorize");
    }
  });
});
