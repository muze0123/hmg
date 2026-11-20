// ISO country codes grouped by applicable continental region; names follow the active locale.
export const regionCountries: Record<string, string[]> = Object.fromEntries(Object.entries({
 asia: 'AF AM AZ BH BD BT BN KH CN CY GE IN ID IR IQ IL JP JO KZ KW KG LA LB MY MV MN MM NP KP OM PK PS PH QA SA SG KR LK SY TW TJ TH TL TR TM AE UZ VN YE',
 europe: 'AL AD AT BY BE BA BG HR CZ DK EE FI FR DE GR HU IS IE IT LV LI LT LU MT MD MC ME NL MK NO PL PT RO RU SM RS SK SI ES SE CH UA GB VA',
 northAmerica: 'AG BS BB BZ CA CR CU DM DO SV GD GT HT HN JM MX NI PA KN LC VC TT US',
 southAmerica: 'AR BO BR CL CO EC GY PY PE SR UY VE',
 africa: 'DZ AO BJ BW BF BI CV CM CF TD KM CG CD CI DJ EG GQ ER SZ ET GA GM GH GN GW KE LS LR LY MG MW ML MR MU MA MZ NA NE NG RW ST SN SC SL SO ZA SS SD TZ TG TN UG ZM ZW',
 oceania: 'AU FJ KI MH FM NR NZ PW PG WS SB TO TV VU',
}).map(([region, codes]) => [region, codes.split(' ')]));
