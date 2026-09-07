export type Category =
  | "urgency"
  | "authority"
  | "financial"
  | "credential"
  | "coercion"
  | "lure";

export interface Signal {
  category: Category;
  label: string;
  match: string;
  weight: number;
}

export interface Analysis {
  score: number; // 0-100
  level: "safe" | "suspicious" | "high" | "critical";
  signals: Signal[];
  categories: { category: Category; label: string; points: number }[];
  advice: string[];
  hindi: string;
}

interface Rule {
  category: Category;
  label: string;
  weight: number;
  patterns: RegExp[];
}

export const CATEGORY_LABELS: Record<Category, string> = {
  urgency: "Artificial urgency",
  authority: "Authority impersonation",
  financial: "Money / UPI request",
  credential: "Credential or OTP harvesting",
  coercion: "Threats & coercion",
  lure: "Too-good-to-be-true lure",
};

const RULES: Rule[] = [
  {
    category: "urgency",
    label: "Deadline pressure",
    weight: 9,
    patterns: [
      /\b(immediately|urgent(ly)?|right now|at once|asap)\b/i,
      /\bwithin\s+\d+\s*(min(ute)?s?|hours?|hrs?)\b/i,
      /\b(last|final)\s+(chance|warning|reminder)\b/i,
      /\bexpir(e|es|ing|ed)\b/i,
      /\btoday only\b/i,
    ],
  },
  {
    category: "authority",
    label: "Claims to be a bank or official body",
    weight: 11,
    patterns: [
      /\b(sbi|hdfc|icici|axis|kotak|paytm|phonepe|google ?pay|bhim)\b/i,
      /\bnpci\b/i,
      /\b(rbi|income ?tax|cyber ?cell|police|customs|trai|kyc department)\b/i,
      /\b(bank|branch) (manager|officer|official|executive)\b/i,
      /\bcustomer (care|support) (executive|officer)\b/i,
    ],
  },
  {
    category: "credential",
    label: "Asks for OTP / PIN / card details",
    weight: 18,
    patterns: [
      /\botp\b/i,
      /\b(upi )?pin\b/i,
      /\bcvv\b/i,
      /\bpassword\b/i,
      /\b(share|send|tell|confirm|verify) (me )?(the )?(otp|pin|code|password)\b/i,
      /\b(aadhaar|aadhar|pan) (number|card|details)\b/i,
      /\b(debit|credit) card (number|details)\b/i,
      /\bnet ?banking (login|credentials|details)\b/i,
    ],
  },
  {
    category: "financial",
    label: "Payment / collect-request mechanics",
    weight: 12,
    patterns: [
      /\b(collect|payment) request\b/i,
      /\bapprove (the )?request\b/i,
      /\bscan (this|the) (qr|code)\b/i,
      /\b(pay|transfer|send) (₹|rs\.?|inr)?\s?\d+/i,
      /\b(₹|rs\.?|inr)\s?\d{2,}/i,
      /\brefund\b/i,
      /\bprocessing fee\b/i,
      /\benter (your )?(upi )?(id|pin) to (receive|get)\b/i,
    ],
  },
  {
    category: "coercion",
    label: "Threats, blocking or legal scare",
    weight: 15,
    patterns: [
      /\b(block(ed|ing)?|suspend(ed|ing)?|freeze|frozen|deactivat(e|ed))\b/i,
      /\b(legal|police|arrest|fir|court|notice|case) (action|complaint|will be|filed)?/i,
      /\bdo not (tell|inform|share with) (anyone|family|police)\b/i,
      /\bkeep (this|it) (secret|confidential)\b/i,
      /\bpenalty\b/i,
      /\baccount will be closed\b/i,
    ],
  },
  {
    category: "lure",
    label: "Prize, cashback or reward bait",
    weight: 10,
    patterns: [
      /\b(you have )?won\b/i,
      /\blottery\b/i,
      /\bcashback\b/i,
      /\blucky (draw|winner)\b/i,
      /\bfree (gift|money|recharge)\b/i,
      /\bwork from home .*(earn|income)\b/i,
      /\bdouble your (money|investment)\b/i,
    ],
  },
];

const LINK_RE = /\b((https?:\/\/|www\.)\S+|\b[a-z0-9-]+\.(xyz|top|info|link|click|online|shop|ru|cc)\b)/i;
const SHORTENER_RE = /\b(bit\.ly|tinyurl|t\.co|rb\.gy|cutt\.ly|is\.gd|shorturl)\b/i;
const PHONE_RE = /\b(\+?91[-\s]?)?[6-9]\d{9}\b/;

export function analyze(text: string): Analysis {
  const input = text.trim();
  const signals: Signal[] = [];

  if (input.length > 0) {
    for (const rule of RULES) {
      let hits = 0;
      for (const p of rule.patterns) {
        const m = input.match(p);
        if (m) {
          hits += 1;
          signals.push({
            category: rule.category,
            label: rule.label,
            match: m[0],
            // repeat hits in one category taper off
            weight: Math.round(rule.weight * (hits === 1 ? 1 : hits === 2 ? 0.6 : 0.35)),
          });
        }
      }
    }

    if (LINK_RE.test(input)) {
      signals.push({
        category: "credential",
        label: "Contains an external link",
        match: input.match(LINK_RE)![0],
        weight: 10,
      });
    }
    if (SHORTENER_RE.test(input)) {
      signals.push({
        category: "credential",
        label: "Shortened link hides the real destination",
        match: input.match(SHORTENER_RE)![0],
        weight: 12,
      });
    }
    if (PHONE_RE.test(input)) {
      signals.push({
        category: "authority",
        label: "Asks you to call an unverified number",
        match: input.match(PHONE_RE)![0],
        weight: 6,
      });
    }
    if (/[A-Z]{6,}/.test(input.replace(/\s/g, ""))) {
      signals.push({
        category: "urgency",
        label: "Shouting capitals",
        match: "ALL CAPS",
        weight: 4,
      });
    }
  }

  const byCat = new Map<Category, number>();
  for (const s of signals) byCat.set(s.category, (byCat.get(s.category) ?? 0) + s.weight);

  const raw = [...byCat.values()].reduce((a, b) => a + b, 0);
  const distinct = byCat.size;
  // combinations of tactics are what make a scam: reward breadth
  const combo = distinct >= 2 ? (distinct - 1) * 7 : 0;
  const score = Math.min(100, Math.round(raw + combo));

  const level: Analysis["level"] =
    score >= 75 ? "critical" : score >= 50 ? "high" : score >= 25 ? "suspicious" : "safe";

  const categories = [...byCat.entries()]
    .map(([category, points]) => ({ category, label: CATEGORY_LABELS[category], points }))
    .sort((a, b) => b.points - a.points);

  return {
    score,
    level,
    signals,
    categories,
    advice: buildAdvice(level, byCat),
    hindi: buildHindi(level, categories),
  };
}

function buildAdvice(level: Analysis["level"], byCat: Map<Category, number>): string[] {
  const tips: string[] = [];
  if (byCat.has("credential"))
    tips.push("Never share an OTP, UPI PIN, CVV or password — no bank ever asks for them.");
  if (byCat.has("financial"))
    tips.push("You never need to pay or enter a PIN to *receive* money. Decline collect requests.");
  if (byCat.has("authority"))
    tips.push("Hang up and call the number printed on your own card or passbook instead.");
  if (byCat.has("coercion"))
    tips.push("Real action is never decided over one call. Being told to stay silent is the scam.");
  if (byCat.has("urgency"))
    tips.push("Pause for two minutes. Urgency is manufactured to stop you from thinking.");
  if (byCat.has("lure")) tips.push("Unrequested prizes and doubled money do not exist.");
  if (level !== "safe")
    tips.push("Report it: call 1930 (cyber helpline) or file at cybercrime.gov.in.");
  if (tips.length === 0)
    tips.push("No known scam patterns found — still verify anything involving money.");
  return tips;
}

const HINDI_LEVEL: Record<Analysis["level"], string> = {
  critical: "बहुत ख़तरनाक: यह लगभग निश्चित रूप से धोखाधड़ी है।",
  high: "ख़तरा: इस संदेश में ठगी के मज़बूत संकेत हैं।",
  suspicious: "सावधान: यह संदेश संदिग्ध लग रहा है।",
  safe: "कोई बड़ा ख़तरा नहीं मिला, फिर भी पैसे से जुड़ी बात सोच-समझकर करें।",
};

const HINDI_CATEGORY: Record<Category, string> = {
  urgency: "जल्दबाज़ी का दबाव बनाया जा रहा है",
  authority: "बैंक या सरकारी अधिकारी बनकर बात की जा रही है",
  financial: "पैसे भेजने या रिक्वेस्ट मंज़ूर करने को कहा जा रहा है",
  credential: "OTP, PIN या कार्ड की जानकारी माँगी जा रही है",
  coercion: "डराया या धमकाया जा रहा है",
  lure: "इनाम या कैशबैक का लालच दिया जा रहा है",
};

function buildHindi(level: Analysis["level"], categories: Analysis["categories"]): string {
  const reasons = categories.slice(0, 3).map((c) => "• " + HINDI_CATEGORY[c.category]);
  const tail =
    level === "safe"
      ? ""
      : "\n\nकिसी को OTP या UPI PIN न बताएं। शक हो तो 1930 पर कॉल करें।";
  return [HINDI_LEVEL[level], ...reasons].join("\n") + tail;
}

export const SAMPLES: { label: string; text: string }[] = [
  {
    label: "Refund verification",
    text: "Dear customer, your recent order of Rs 4,299 was cancelled. Your refund of Rs 4,299 is pending. To receive it, approve the collect request in your PhonePe app and enter your UPI PIN within 10 minutes, else refund will expire. Support: 9812345670",
  },
  {
    label: "KYC block threat",
    text: "URGENT: Your SBI account will be blocked today as KYC is incomplete. Update immediately at http://sbi-kyc-verify.top/login or call bank officer. Failure will lead to account suspension and penalty.",
  },
  {
    label: "Digital arrest coercion",
    text: "This is Cyber Cell. A parcel in your name contains illegal items. An FIR will be filed and arrest warrant issued. Do not tell anyone, keep this confidential. Pay Rs 25000 verification fee now to close the case.",
  },
  {
    label: "Prize lure",
    text: "Congratulations! You have won Rs 10,00,000 in the lucky draw. Send Rs 999 processing fee and share your OTP to claim. Click bit.ly/claim-now",
  },
  {
    label: "Genuine message",
    text: "Hi, your electricity bill for August is ready. You can view and pay it from the official app whenever convenient this month.",
  },
];
