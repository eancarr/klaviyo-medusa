import { IModuleService } from "@medusajs/types";
import {
  PostProfileResponse,
  ProfileCreateQueryResourceObjectAttributes,
  ProfileSubscriptionCreateQueryResourceObject,
} from "klaviyo-api";

export const KLAVIYO_MODULE = "klaviyo";

export interface IKlaviyoService extends IModuleService {
  createProfile(
    attributes: ProfileCreateQueryResourceObjectAttributes
  ): Promise<PostProfileResponse>;
}

export interface KlaviyoConsent {
  email?: boolean;
  sms?: boolean;
  transactional_sms?: boolean;
  consented_at?: string; // ISO date string
}

export interface KlaviyoBulkSubscribePayload {
  profiles: {
    data: {
      type: "profile";
      id?: string;
      attributes: {
        email?: string;
        phone_number?: string;
        external_id?: string;
      };
    }[];
  };
  list_id?: string;
  subscription_options?: {
    channels: {
      email?: boolean;
      sms?: boolean;
    };
    consent_method: string; // e.g., "collection_form", "import", "checkout_page"
    consent_at?: string; // ISO date string
    historical_import?: boolean;
  };
}

export interface IKlaviyoService {
  createProfile(
    attributes: ProfileCreateQueryResourceObjectAttributes
  ): Promise<any>;
  createEvent(eventPayload: any): Promise<any>;
  bulkSubscribeProfiles(
    payload: ProfileSubscriptionCreateQueryResourceObject[]
  ): Promise<any>;
}
