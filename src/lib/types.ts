export type Task = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  priority: string;
  due_date: string | null;
  partner_id: string | null;
  location_lat_lng: string | null;
  image_path: string | null;
  checklist: { sop_education: boolean; marketing_material: boolean; asset_check: boolean } | null;
  position: number | null;
  created_at: string;
  updated_at: string;
  partner?: Partner | null;
};

export type Partner = {
  id: string;
  name: string;
  city: string | null;
  shipper: string | null;
  trend_shipper: string | null;
  awb_otomatis: number | null;
  trend_awb_otomatis: string | null;
  awb_manual: number | null;
  owner: string | null;
  longlat: string | null;
};

export type Insight = {
  id: string;
  competitor_name: string;
  strategy_type: string | null;
  description: string | null;
  created_at: string;
  updated_at?: string;
};

export type Reimbursement = {
  id: string;
  form_type: string;
  amount: number;
  receipt_image_url: string | null;
  description: string | null;
  status: string;
  created_at: string;
  updated_at?: string;
};
