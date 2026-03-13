export class GoogleAdsAuthService {
  constructor(private clientId: string, private clientSecret: string, private developerToken: string) {}

  generateAuthUrl(redirectUri: string): string {
    const scopes = 'https://www.googleapis.com/auth/adwords';
    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${this.clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scopes}&access_type=offline`;
  }
}
