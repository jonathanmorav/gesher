"use client";

import { useLocale } from "./LocaleProvider";

export function PrivacyCopy() {
  const { locale, t } = useLocale();
  const he = locale === "he";

  return (
    <article className="legal">
      <h1>{t("privacy")}</h1>
      <p className="page-lead">{t("privacyLead")}</p>
      {he ? (
        <>
          <h2>מה נשמר במכשיר</h2>
          <p>
            גשר שומר במכשיר את שפת הממשק, תחנת הרדיו האחרונה ועוצמת השמע. אלה העדפות מקומיות בלבד, לא חשבון
            משתמש.
          </p>
          <h2>מה לא נאסף</h2>
          <p>
            אין יצירת חשבון, אין ניתוח שימוש, אין פרסום מזהה ואין שיתוף מידע עם רשתות פרסום. האפליקציה לא
            משתמשת ב-App Tracking Transparency כי אין מעקב אחרי משתמשים.
          </p>
          <h2>תוכן מצד שלישי</h2>
          <p>
            הכותרות מגיעות מפידי RSS וממשקי חדשות ציבוריים. לחיצה על כתבה פותחת את אתר המוציא לאור. שידורי
            הרדיו והפודקאסטים מגיעים מהמקורות עצמם. תרגום כותרות משתמש בשירותי תרגום ציבוריים של גוגל כדי
            להציג עברית או אנגלית לפי בחירתכם.
          </p>
          <h2>יצירת קשר</h2>
          <p>
            לשאלות על פרטיות:{" "}
            <a href="mailto:jonathantmorav@gmail.com">jonathantmorav@gmail.com</a>
          </p>
        </>
      ) : (
        <>
          <h2>What stays on your device</h2>
          <p>
            Gesher stores interface language, the last radio station, and volume on the device. These are local
            preferences only. There is no user account.
          </p>
          <h2>What we do not collect</h2>
          <p>
            No sign-in, no analytics, no advertising identifiers, and no sharing with ad networks. The app does
            not use App Tracking Transparency because it does not track users.
          </p>
          <h2>Third-party content</h2>
          <p>
            Headlines come from public RSS feeds and news APIs. Tapping a story opens the publisher’s site.
            Radio and podcast audio come from the original streams. Headline translation uses public Google
            Translate endpoints so you can read Hebrew or English.
          </p>
          <h2>Contact</h2>
          <p>
            Privacy questions: <a href="mailto:jonathantmorav@gmail.com">jonathantmorav@gmail.com</a>
          </p>
        </>
      )}
    </article>
  );
}

export function SupportCopy() {
  const { locale, t } = useLocale();
  const he = locale === "he";

  return (
    <article className="legal">
      <h1>{t("support")}</h1>
      {he ? (
        <>
          <p className="page-lead">גשר הוא אפליקציית כותרות, רדיו חי ופודקאסטים לישראל.</p>
          <p>
            אם שידור לא נפתח, נסו תחנה אחרת או רענון. אם כותרת חסרה, ייתכן שהפיד של המקור לא זמין כרגע — זה
            מופיע בהערת הטעינה.
          </p>
          <p>
            תמיכה: <a href="mailto:jonathantmorav@gmail.com">jonathantmorav@gmail.com</a>
          </p>
        </>
      ) : (
        <>
          <p className="page-lead">Gesher is an Israel headlines, live radio, and podcasts app.</p>
          <p>
            If a station will not start, try another stream or refresh. If a newsroom is missing, its feed may
            be down — the app shows that in the source note.
          </p>
          <p>
            Support: <a href="mailto:jonathantmorav@gmail.com">jonathantmorav@gmail.com</a>
          </p>
        </>
      )}
    </article>
  );
}
