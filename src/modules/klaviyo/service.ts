import {
  ApiKeySession,
  EventsApi,
  ProfileCreateQueryResourceObjectAttributes,
  ProfileEnum,
  ProfilesApi,
  ProfileSubscriptionBulkCreateJobEnum,
  ProfileSubscriptionCreateQueryResourceObject,
  SubscriptionCreateJobCreateQuery,
} from "klaviyo-api";

type ModuleOptions = {
  apiKey: string;
};

class KlaviyoService {
  private readonly apiKey: string;
  private readonly session: ApiKeySession;

  constructor({}, options: ModuleOptions) {
    this.apiKey = options.apiKey;

    this.session = new ApiKeySession(this.apiKey);
  }

  async upsertProfile(attributes: ProfileCreateQueryResourceObjectAttributes) {
    const profilesApi = new ProfilesApi(this.session);
    const profile = await profilesApi
      .createOrUpdateProfile({
        data: {
          type: ProfileEnum.Profile,
          attributes,
        },
      })
      .then(({ body }) => body);

    return profile;
  }

  async createEvent(eventPayload: any) {
    const eventsApi = new EventsApi(this.session);
    const event = await eventsApi
      .createEvent({
        data: {
          type: "event",
          attributes: eventPayload,
        },
      })
      .then(({ body }) => body);

    return event;
  }

  async bulkSubscribeProfiles(
    payload: ProfileSubscriptionCreateQueryResourceObject[]
  ) {
    try {
      const profilesApi = new ProfilesApi(this.session);

      // Format according to the SDK's expected structure
      const subscriptionJobPayload: SubscriptionCreateJobCreateQuery = {
        data: {
          type: ProfileSubscriptionBulkCreateJobEnum.ProfileSubscriptionBulkCreateJob,
          attributes: {
            profiles: {
              data: payload,
            },
            customSource: "medusa-klaviyo-integration",
          },
        },
      };

      const response = await profilesApi
        .bulkSubscribeProfiles(subscriptionJobPayload)
        .then((res) => res.body)
        .catch((error) => {
          throw new Error("Error bulk subscribing profiles to Klaviyo");
        });

      return response;
    } catch (error) {
      console.error("Error bulk subscribing profiles to Klaviyo");
      throw error;
    }
  }
}

export default KlaviyoService;
