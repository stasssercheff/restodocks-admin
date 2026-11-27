-- Fix admin establishment delete when venue has POS history.
--
-- Two blockers:
-- 1) pos_order_lines.tech_card_id → tech_cards ON DELETE RESTRICT
--    (_delete_establishment_cascade deleted tech_cards while lines still existed)
-- 2) pos_reject_closed_sale_delete / pos_payments_reject_closed_delete
--    block DELETE of closed/refunded orders (pos_closed_sale_immutable)
--
-- Allow those deletes only when restodocks.cascade_authorized='1'
-- (already set by _delete_establishment_cascade for owner/service wipe),
-- and delete pos_orders before tech_cards.

CREATE OR REPLACE FUNCTION public.pos_reject_closed_sale_delete()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF coalesce(current_setting('restodocks.cascade_authorized', true), '') = '1' THEN
    RETURN OLD;
  END IF;
  IF OLD.status IN ('closed', 'refunded') THEN
    RAISE EXCEPTION 'pos_closed_sale_immutable'
      USING ERRCODE = '42501';
  END IF;
  RETURN OLD;
END;
$$;

CREATE OR REPLACE FUNCTION public.pos_payments_reject_closed_delete()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_status text;
BEGIN
  IF coalesce(current_setting('restodocks.cascade_authorized', true), '') = '1' THEN
    RETURN OLD;
  END IF;
  SELECT status INTO v_status
  FROM public.pos_orders
  WHERE id = OLD.order_id;
  IF v_status IN ('closed', 'refunded') THEN
    RAISE EXCEPTION 'pos_closed_sale_immutable'
      USING ERRCODE = '42501';
  END IF;
  RETURN OLD;
END;
$$;

CREATE OR REPLACE FUNCTION public._delete_establishment_cascade(p_establishment_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  r RECORD;
BEGIN
  -- Direct RPC: only the primary owner (or service_role). Recursive child
  -- deletes and delete_owner_account_data reuse the same session flag.
  IF coalesce(current_setting('restodocks.cascade_authorized', true), '') <> '1' THEN
    IF NOT public._caller_is_service_role() THEN
      IF auth.uid() IS NULL OR NOT EXISTS (
        SELECT 1
        FROM public.establishments e
        WHERE e.id = p_establishment_id
          AND e.owner_id = auth.uid()
      ) THEN
        RAISE EXCEPTION 'permission denied' USING ERRCODE = '42501';
      END IF;
    END IF;
    PERFORM set_config('restodocks.cascade_authorized', '1', true);
  END IF;

  PERFORM set_config('restodocks.tt_ingredients_replace', 'on', true);

  FOR r IN SELECT id FROM establishments WHERE parent_establishment_id = p_establishment_id
  LOOP
    PERFORM _delete_establishment_cascade (r.id);
  END LOOP;

  DELETE FROM pending_owner_registrations WHERE establishment_id = p_establishment_id;
  DELETE FROM password_reset_tokens WHERE employee_id IN (SELECT id FROM employees WHERE establishment_id = p_establishment_id);
  DELETE FROM co_owner_invitations WHERE establishment_id = p_establishment_id;
  DELETE FROM employee_direct_messages WHERE sender_employee_id IN (SELECT id FROM employees WHERE establishment_id = p_establishment_id)
     OR recipient_employee_id IN (SELECT id FROM employees WHERE establishment_id = p_establishment_id);

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chat_room_messages') THEN
    DELETE FROM chat_room_messages WHERE chat_room_id IN (SELECT id FROM chat_rooms WHERE establishment_id = p_establishment_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chat_room_members') THEN
    DELETE FROM chat_room_members WHERE chat_room_id IN (SELECT id FROM chat_rooms WHERE establishment_id = p_establishment_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chat_rooms') THEN
    DELETE FROM chat_rooms WHERE establishment_id = p_establishment_id;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'establishment_entitlement_addons') THEN
    DELETE FROM establishment_entitlement_addons WHERE establishment_id = p_establishment_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'establishment_trial_usage') THEN
    DELETE FROM establishment_trial_usage WHERE establishment_id = p_establishment_id;
  END IF;
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'apple_iap_subscription_claims'
      AND column_name = 'establishment_id'
  ) THEN
    DELETE FROM apple_iap_subscription_claims WHERE establishment_id = p_establishment_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'iap_billing_test_state') THEN
    DELETE FROM iap_billing_test_state WHERE establishment_id = p_establishment_id;
  END IF;

  DELETE FROM inventory_documents WHERE establishment_id = p_establishment_id;
  DELETE FROM order_documents WHERE establishment_id = p_establishment_id;
  DELETE FROM inventory_drafts WHERE establishment_id = p_establishment_id;
  DELETE FROM establishment_schedule_data WHERE establishment_id = p_establishment_id;
  DELETE FROM establishment_order_list_data WHERE establishment_id = p_establishment_id;
  DELETE FROM product_price_history WHERE establishment_id = p_establishment_id;
  DELETE FROM establishment_products WHERE establishment_id = p_establishment_id;

  -- POS: clear orders before tech_cards (lines RESTRICT tech_card_id;
  -- closed-sale triggers honor cascade_authorized above).
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pos_orders') THEN
    DELETE FROM pos_orders WHERE establishment_id = p_establishment_id;
  END IF;

  DELETE FROM tt_ingredients WHERE tech_card_id IN (SELECT id FROM tech_cards WHERE establishment_id = p_establishment_id);
  DELETE FROM tech_cards WHERE establishment_id = p_establishment_id;
  DELETE FROM checklist_drafts WHERE checklist_id IN (SELECT id FROM checklists WHERE establishment_id = p_establishment_id);
  DELETE FROM checklist_items WHERE checklist_id IN (SELECT id FROM checklists WHERE establishment_id = p_establishment_id);
  DELETE FROM checklist_submissions WHERE checklist_id IN (SELECT id FROM checklists WHERE establishment_id = p_establishment_id);
  DELETE FROM checklists WHERE establishment_id = p_establishment_id;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'iiko_blank_storage') THEN
    DELETE FROM iiko_blank_storage WHERE establishment_id = p_establishment_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'iiko_products') THEN
    DELETE FROM iiko_products WHERE establishment_id = p_establishment_id;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'haccp_numeric_logs') THEN
    DELETE FROM haccp_numeric_logs WHERE establishment_id = p_establishment_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'haccp_status_logs') THEN
    DELETE FROM haccp_status_logs WHERE establishment_id = p_establishment_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'haccp_quality_logs') THEN
    DELETE FROM haccp_quality_logs WHERE establishment_id = p_establishment_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'haccp_logs') THEN
    DELETE FROM haccp_logs WHERE establishment_id = p_establishment_id;
  END IF;

  UPDATE establishments
  SET owner_id = NULL
  WHERE id = p_establishment_id
     OR owner_id IN (SELECT id FROM employees WHERE establishment_id = p_establishment_id);

  DELETE FROM employees WHERE establishment_id = p_establishment_id;
  DELETE FROM establishments WHERE id = p_establishment_id;
END;
$function$;
