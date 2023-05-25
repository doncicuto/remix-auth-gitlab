import { OAuth2Strategy } from "remix-auth-oauth2";
import createDebug from "debug";
import type { StrategyVerifyCallback } from "remix-auth";
import type {
  OAuth2Profile,
  OAuth2StrategyVerifyParams,
} from "remix-auth-oauth2";

let debug = createDebug("RemixAuthGitlab");

// Gitlab OAuth2 scopes: https://docs.gitlab.com/ee/integration/oauth_provider.html#authorized-applications
export type GitlabScope =
  | "api"
  | "read_user"
  | "read_api"
  | "read_repository"
  | "write_repository"
  | "read_registry"
  | "write_registry"
  | "sudo"
  | "openid"
  | "profile"
  | "email";

export interface GitlabStrategyOptions {
  clientID: string;
  clientSecret: string;
  callbackURL: string;
  scope?: GitlabScope[];
  userAgent?: string;
  baseURL?: string;
  authorizationURL?: string;
  tokenURL?: string;
  userInfoURL?: string;
}

export interface GitlabProfile extends OAuth2Profile {
  id: string;
  displayName: string;
  name: {
    familyName: string;
    givenName: string;
    middleName: string;
  };
  emails: [{ value: string }];
  photos: [{ value: string }];
  _json: {
    username: string;
    id: number;
    node_id: string;
    avatar_url: string;
    gravatar_id: string;
    url: string;
    html_url: string;
    followers_url: string;
    following_url: string;
    gists_url: string;
    starred_url: string;
    subscriptions_url: string;
    organizations_url: string;
    repos_url: string;
    events_url: string;
    received_events_url: string;
    type: string;
    site_admin: boolean;
    name: string;
    company: string;
    blog: string;
    location: string;
    email: string;
    hireable: boolean;
    bio: string;
    twitter_username: string;
    public_repos: number;
    public_gists: number;
    followers: number;
    following: number;
    created_at: string;
    updated_at: string;
    private_gists: number;
    total_private_repos: number;
    owned_private_repos: number;
    disk_usage: number;
    collaborators: number;
    two_factor_authentication: boolean;
    plan: {
      name: string;
      space: number;
      private_repos: number;
      collaborators: number;
    };
  };
}

export interface GitlabExtraParams extends Record<string, string | number> {
  tokenType: string;
}

export class GitlabStrategy<User> extends OAuth2Strategy<
  User,
  GitlabProfile,
  GitlabExtraParams
> {
  name = "gitlab";

  private scope: GitlabScope[];
  private userAgent: string;
  private userInfoURL: string;

  constructor(
    {
      clientID,
      clientSecret,
      callbackURL,
      scope,
      userAgent,
      userInfoURL,
      baseURL = "https://gitlab.com",
      authorizationURL = `${baseURL}/oauth/authorize`,
      tokenURL = `${baseURL}/oauth/token`,
    }: GitlabStrategyOptions,
    verify: StrategyVerifyCallback<
      User,
      OAuth2StrategyVerifyParams<GitlabProfile, GitlabExtraParams>
    >
  ) {
    super(
      {
        clientID,
        clientSecret,
        callbackURL,
        authorizationURL,
        tokenURL,
      },
      verify
    );
    this.scope = scope ?? ["read_user"];
    this.userAgent = userAgent ?? "Remix Auth";
    this.userInfoURL = userInfoURL || `${baseURL}/api/v4/user`;
  }

  protected authorizationParams(): URLSearchParams {
    return new URLSearchParams({
      scope: this.scope.join(" "),
    });
  }

  protected async userProfile(accessToken: string): Promise<GitlabProfile> {
    let response = await fetch(this.userInfoURL, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": this.userAgent,
      },
    });
    let data: GitlabProfile["_json"] = await response.json();
    debug("Calling User Profile API - Response", data);

    let profile: GitlabProfile = {
      provider: "gitlab",
      displayName: data.username,
      id: String(data.id),
      name: {
        familyName: data.name,
        givenName: data.name,
        middleName: data.name,
      },
      emails: [{ value: data.email }],
      photos: [{ value: data.avatar_url }],
      _json: data,
    };

    return profile;
  }

  protected async getAccessToken(response: Response): Promise<{
    accessToken: string;
    refreshToken: string;
    extraParams: GitlabExtraParams;
  }> {
    let { access_token, refresh_token, ...extraParams } = await response.json();
    debug("Retrieved AccessToken", access_token);
    debug("Retrieved RefreshToken", refresh_token);
    return {
      accessToken: access_token as string,
      refreshToken: refresh_token as string,
      extraParams,
    } as const;
  }
}
