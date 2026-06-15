// Props for the Create Enquiry form. `prefill` arrives from Fleet Explorer's
// "Use in enquiry" deep link (vessel type + region).
export interface CreateEnquiryPrefill {
  vesselType?: string;
  regionCode?: string;
}

export interface CreateEnquiryFormProps {
  prefill?: CreateEnquiryPrefill;
}
