import axios from 'axios';

export class GoogleAdsCampaignService {
  constructor(private customerId: string, private accessToken: string, private developerToken: string) {}

  async listAdGroups() {
    const url = `https://googleads.googleapis.com/v15/customers/${this.customerId}/googleAds:search`;
    const query = 'SELECT ad_group.id, ad_group.name, ad_group.status FROM ad_group WHERE ad_group.status = "ENABLED"';
    
    const response = await axios.post(url, { query }, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'developer-token': this.developerToken
      }
    });
    return response.data;
  }

  async pauseAdGroup(adGroupId: string) {
    const url = `https://googleads.googleapis.com/v15/customers/${this.customerId}/adGroups:mutate`;
    const operation = {
      update: {
        resource_name: `customers/${this.customerId}/adGroups/${adGroupId}`,
        status: 'PAUSED'
      },
      update_mask: 'status'
    };

    await axios.post(url, { operations: [operation] }, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'developer-token': this.developerToken
      }
    });
  }
}
