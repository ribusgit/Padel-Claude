CREATE TABLE public.material_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'otros',
  quantity integer NOT NULL DEFAULT 1,
  unit_cost numeric NOT NULL DEFAULT 0,
  purchase_date date NOT NULL DEFAULT CURRENT_DATE,
  supplier text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.material_items TO authenticated;
GRANT ALL ON public.material_items TO service_role;
ALTER TABLE public.material_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin manages material" ON public.material_items FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.material_budgets (
  month text NOT NULL PRIMARY KEY,
  amount numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.material_budgets TO authenticated;
GRANT ALL ON public.material_budgets TO service_role;
ALTER TABLE public.material_budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin manages material budget" ON public.material_budgets FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER material_budgets_updated_at BEFORE UPDATE ON public.material_budgets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();