-- Auto-update updated_at on tasks
DROP TRIGGER IF EXISTS trg_tasks_updated_at ON public.tasks;
CREATE TRIGGER trg_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Also for reimbursements and insights so detail drawers reflect last-edit
DROP TRIGGER IF EXISTS trg_reimb_updated_at ON public.admin_reimbursements;
CREATE TRIGGER trg_reimb_updated_at
BEFORE UPDATE ON public.admin_reimbursements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_insights_updated_at ON public.market_insights;
CREATE TRIGGER trg_insights_updated_at
BEFORE UPDATE ON public.market_insights
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();