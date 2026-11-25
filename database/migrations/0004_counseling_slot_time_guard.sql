-- RUANGAMAN - MIGRATION 0004
-- Never allow a counseling booking for a slot that has already started or ended.
-- CREATE OR REPLACE preserves the existing function identity, owner, and grants.

CREATE OR REPLACE FUNCTION public.book_counseling_slot(
    p_slot_id              UUID,
    p_booking_code         TEXT,
    p_student_name         TEXT,
    p_contact_method       TEXT,
    p_contact_value        TEXT,
    p_privacy_acknowledged BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
    v_slot       RECORD;
    v_booking_id UUID := gen_random_uuid();
    v_result     JSONB;
BEGIN
    SELECT * INTO v_slot
    FROM public.counseling_slots
    WHERE id = p_slot_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'SLOT_NOT_FOUND: Slot konseling tidak ditemukan'
            USING ERRCODE = 'P0001';
    END IF;

    IF v_slot.status <> 'available' THEN
        RAISE EXCEPTION 'SLOT_UNAVAILABLE: Slot konseling sudah tidak tersedia'
            USING ERRCODE = 'P0002';
    END IF;

    IF NOT v_slot.is_published THEN
        RAISE EXCEPTION 'SLOT_NOT_PUBLISHED: Slot konseling tidak dipublikasikan'
            USING ERRCODE = 'P0003';
    END IF;

    -- A slot is no longer bookable once its start time has arrived.
    -- Also reject malformed/expired intervals whose end time has passed.
    IF v_slot.start_at <= now() OR v_slot.end_at <= now() THEN
        RAISE EXCEPTION 'SLOT_EXPIRED: Jadwal konseling telah lewat'
            USING ERRCODE = 'P0004';
    END IF;

    INSERT INTO public.counseling_bookings (
        id,
        slot_id,
        booking_code,
        student_name,
        contact_method,
        contact_value,
        privacy_acknowledged,
        booking_status
    )
    VALUES (
        v_booking_id,
        p_slot_id,
        p_booking_code,
        p_student_name,
        p_contact_method,
        p_contact_value,
        p_privacy_acknowledged,
        'confirmed'
    );

    UPDATE public.counseling_slots
    SET status = 'booked'
    WHERE id = p_slot_id;

    SELECT row_to_json(b)::JSONB
    INTO v_result
    FROM public.counseling_bookings b
    WHERE b.id = v_booking_id;

    RETURN v_result;
END;
$function$;
