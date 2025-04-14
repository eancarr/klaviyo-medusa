import { MedusaService } from "@medusajs/framework/utils";
import {
  ApiKeySession,
  EventsApi,
  ProfileCreateQueryResourceObjectAttributes,
  ProfileEnum,
  ProfilesApi,
  ProfileSubscriptionBulkCreateJobEnum,
  ProfileSubscriptionCreateQueryResourceObject,
  SubscriptionChannels,
  SubscriptionCreateJobCreateQuery,
  SubscriptionParameters,
} from "klaviyo-api";
import { KlaviyoBulkSubscribePayload } from "../../types/klaviyo";
import KlaviyoListConfig from "./models/klaviyo-list-config";

type ModuleOptions = {
  apiKey: string;
};

class KlaviyoService extends MedusaService({
  KlaviyoListConfig,
}) {
  private readonly apiKey: string;
  private readonly session: ApiKeySession;

  constructor({}, options: ModuleOptions) {
    super(options);
    this.apiKey = options.apiKey;

    this.session = new ApiKeySession(this.apiKey);
  }

  async createProfile(attributes: ProfileCreateQueryResourceObjectAttributes) {
    const profilesApi = new ProfilesApi(this.session);
    const profile = await profilesApi
      .createProfile({
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
    console.log("payload from bulkSubscribeProfiles", JSON.stringify(payload));
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
