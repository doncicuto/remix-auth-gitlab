# GitlabStrategy

The Gitlab strategy for [remix-auth](https://github.com/sergiodxa/remix-auth) is used to authenticate users against a Gitlab account. It extends the OAuth2Strategy.

## Supported runtimes

| Runtime    | Has Support |
| ---------- | ----------- |
| Node.js    | ✅          |
| Cloudflare | ✅          |

## Usage

### Create an OAuth application

Follow the steps on [the Gitlab documentation](https://docs.gitlab.com/ee/integration/oauth_provider.html) to create a new application and get a client ID and secret.

### Create the strategy instance

```ts
import { GitlabStrategy } from "remix-auth-gitlab";

let gitlabStrategy = new GitlabStrategy(
  {
    clientID: "YOUR_CLIENT_ID",
    clientSecret: "YOUR_CLIENT_SECRET",
    callbackURL: "https://example.com/auth/gitlab/callback",
  },
  async ({ accessToken, extraParams, profile }) => {
    // Get the user data from your DB or API using the tokens and profile
    return User.findOrCreate({ email: profile.emails[0].value });
  }
);

authenticator.use(gitlabStrategy);
```

### Setup your routes

```tsx
// app/routes/login.tsx
export default function Login() {
  return (
    <Form action="/auth/gitlab" method="post">
      <button>Login with Gitlab</button>
    </Form>
  );
}
```

```tsx
// app/routes/auth/gitlab.tsx
import { ActionFunction, LoaderFunction, redirect } from "remix";
import { authenticator } from "~/auth.server";

export let loader: LoaderFunction = () => redirect("/login");

export let action: ActionFunction = ({ request }) => {
  return authenticator.authenticate("gitlab", request);
};
```

```tsx
// app/routes/auth/gitlab/callback.tsx
import { LoaderFunction } from "remix";
import { authenticator } from "~/auth.server";

export let loader: LoaderFunction = ({ request }) => {
  return authenticator.authenticate("gitlab", request, {
    successRedirect: "/dashboard",
    failureRedirect: "/login",
  });
};
```

### Aknowledgements

[@sergiodxa](https://github.com/sergiodxa): for [remix-auth](https://github.com/sergiodxa/remix-auth), [remix-auth-strategy-template](https://github.com/sergiodxa/remix-auth-strategy-template) and for so many repositories and blog posts that make Remix easier to use and learn.
