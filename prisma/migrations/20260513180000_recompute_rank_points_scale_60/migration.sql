-- Rank ball: maks. 60 (to'g'rilik) + maks. 39 (tezlik), `lib/rank-points.ts` bilan mos
UPDATE "TestAttempt" AS ta
SET "rankPoints" = sub."new_pts"
FROM (
  SELECT
    ta2.id,
    GREATEST(
      0,
      LEAST(
        99,
        LEAST(60, ROUND((60.0 * ta2."score") / NULLIF(ta2."total", 0)))::int
          + LEAST(
            39,
            GREATEST(
              0,
              ROUND(
                (
                  GREATEST(
                    0::numeric,
                    GREATEST(120, t."durationMinutes" * 60)::numeric - LEAST(
                      COALESCE(ta2."secondsUsed"::numeric, GREATEST(120, t."durationMinutes" * 60)::numeric),
                      (GREATEST(120, t."durationMinutes" * 60) + 180)::numeric
                    )
                  ) / NULLIF(GREATEST(120, t."durationMinutes" * 60)::numeric, 0)
                ) * 39
              )
            )::int
          )
      )
    ) AS new_pts
  FROM "TestAttempt" ta2
  INNER JOIN "Test" t ON t.id = ta2."testId"
  WHERE ta2."total" > 0
) AS sub
WHERE ta.id = sub.id;
