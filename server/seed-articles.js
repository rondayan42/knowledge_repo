/* ==========================================
   Seed Articles Script
   Creates sample articles for testing UI with many articles
   ========================================== */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
});

// Sample data for generating articles
const loremParagraphs = [
    'זהו טקסט לדוגמה המיועד לבדיקת עיצוב ותצוגה של מערכת ניהול הידע. הטקסט מכיל מידע מגוון שיכול לעזור בהבנת האופן שבו התוכן מוצג למשתמשים.',
    'מערכת ניהול הידע מאפשרת לארגונים לשתף מידע בצורה יעילה. היא כוללת כלים לחיפוש, סינון ומיון של מאמרים לפי קטגוריות שונות.',
    'חשוב לוודא שכל המידע שמועלה למערכת מעודכן ומדויק. משתמשים תלויים במידע זה לצורך עבודתם היומיומית.',
    'הדרכות והכשרות הן חלק חשוב מתהליך העבודה. מאמרי הדרכה מספקים מידע מפורט על תהליכים ונהלים שונים.',
    'תמיכה טכנית זמינה לכל המשתמשים. ניתן לפנות לצוות התמיכה בכל שאלה או בעיה שמתעוררת.',
    'נהלי עבודה ברורים מסייעים לשמור על עקביות ואיכות. חשוב לעקוב אחר הנהלים המעודכנים ביותר.',
    'שיתוף פעולה בין מחלקות הוא מפתח להצלחה. מערכת זו מאפשרת לכל הצוותים לגשת למידע משותף.',
    'עדכונים שוטפים מבטיחים שהמידע תמיד רלוונטי. מומלץ לבדוק את המאמרים באופן קבוע.',
];

const articleTitles = [
    'מדריך התחלה מהירה למערכת',
    'נהלי אבטחת מידע בארגון',
    'הדרכה על שימוש בכלי הדיווח',
    'תהליך קליטת עובד חדש',
    'מדריך לפתרון בעיות נפוצות',
    'סקירת מוצרים ושירותים',
    'עדכונים חדשים במערכת',
    'הנחיות לעבודה מרחוק',
    'מדריך לשירות לקוחות מעולה',
    'תהליכי עבודה יעילים',
    'טיפים לניהול זמן',
    'הכרת כלי העבודה',
    'נהלי בטיחות בעבודה',
    'מדריך למילוי טפסים',
    'הנחיות לפגישות אפקטיביות',
    'סקירת תהליכים עסקיים',
    'מדריך לשימוש באינטרנט',
    'הדרכה על מערכת הCRM',
    'נהלי גיבוי מידע',
    'מדריך לתקשורת פנים ארגונית',
    'הכרת מבנה הארגון',
    'תהליך אישור בקשות',
    'מדריך לכתיבת דוחות',
    'הנחיות לעבודה בצוות',
    'סקירת מדיניות החברה',
    'מדריך לשימוש בדואר אלקטרוני',
    'הדרכה על ניהול פרויקטים',
    'נהלי רכש ואספקה',
    'מדריך לניהול לקוחות',
    'הכרת זכויות עובדים',
    'תהליך פיתוח מוצר חדש',
    'מדריך לניתוח נתונים',
    'הנחיות לשיווק דיגיטלי',
    'סקירת כלי אוטומציה',
    'מדריך לאבטחת סיסמאות',
    'הדרכה על עבודה עם API',
    'נהלי שירות לאחר מכירה',
    'מדריך לניהול מלאי',
    'הכרת תשתיות הארגון',
    'תהליך גיוס ומיון',
    'מדריך לבניית מצגות',
    'הנחיות לניהול תקציב',
    'סקירת מערכות מידע',
    'מדריך לעבודה עם Excel',
    'הדרכה על ניהול קשרי לקוחות',
    'נהלי תחזוקה שוטפת',
    'מדריך לשירותי ענן',
    'הכרת תהליכי הנהלת חשבונות',
    'תהליך הערכת עובדים',
    'מדריך לשיתוף מסמכים',
];

const tagOptions = [
    'חדש', 'מעודכן', 'חשוב', 'דחוף', 'הדרכה',
    'טכני', 'נוהל', 'מדריך', 'עדכון', 'טיפ',
    'בטיחות', 'שירות', 'ניהול', 'תקשורת', 'מערכות'
];

function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomElements(arr, min, max) {
    const count = Math.floor(Math.random() * (max - min + 1)) + min;
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

function generateContent() {
    const numParagraphs = Math.floor(Math.random() * 4) + 2;
    const selected = getRandomElements(loremParagraphs, numParagraphs, numParagraphs);
    return selected.map(p => `<p>${p}</p>`).join('\n');
}

function generateSummary() {
    return getRandomElement(loremParagraphs).substring(0, 200) + '...';
}

async function seedArticles(count = 50) {
    const client = await pool.connect();

    try {
        console.log(`\n🌱 Starting to seed ${count} articles...\n`);

        // Get existing categories, departments, priorities
        const categoriesResult = await client.query('SELECT id FROM categories');
        const departmentsResult = await client.query('SELECT id FROM departments');
        const prioritiesResult = await client.query('SELECT id FROM priorities');

        const categoryIds = categoriesResult.rows.map(r => r.id);
        const departmentIds = departmentsResult.rows.map(r => r.id);
        const priorityIds = prioritiesResult.rows.map(r => r.id);

        if (categoryIds.length === 0 || departmentIds.length === 0 || priorityIds.length === 0) {
            console.error('❌ Error: No categories, departments, or priorities found. Please run the server first to seed default data.');
            return;
        }

        // Track seeded article IDs for cleanup
        const seededIds = [];

        await client.query('BEGIN');

        for (let i = 0; i < count; i++) {
            // Generate unique title with index
            const baseTitle = getRandomElement(articleTitles);
            const title = `${baseTitle} #${Date.now()}-${i + 1}`;

            const summary = generateSummary();
            const content = generateContent();
            const categoryId = getRandomElement(categoryIds);
            const departmentId = getRandomElement(departmentIds);
            const priorityId = getRandomElement(priorityIds);

            // Insert article
            const result = await client.query(`
                INSERT INTO articles (title, summary, content, category_id, department_id, priority_id, author, author_id, views)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING id
            `, [
                title,
                summary,
                content,
                categoryId,
                departmentId,
                priorityId,
                'Seed Script',
                'seed-script-user',
                Math.floor(Math.random() * 500)
            ]);

            const articleId = result.rows[0].id;
            seededIds.push(articleId);

            // Add random tags
            const tags = getRandomElements(tagOptions, 1, 4);
            for (const tagName of tags) {
                // Get or create tag
                let tagResult = await client.query('SELECT id FROM tags WHERE name = $1', [tagName]);
                let tagId;

                if (tagResult.rows.length === 0) {
                    const newTag = await client.query('INSERT INTO tags (name) VALUES ($1) RETURNING id', [tagName]);
                    tagId = newTag.rows[0].id;
                } else {
                    tagId = tagResult.rows[0].id;
                }

                // Link tag to article
                await client.query(
                    'INSERT INTO article_tags (article_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                    [articleId, tagId]
                );
            }

            // Progress indicator
            if ((i + 1) % 10 === 0) {
                console.log(`   ✅ Seeded ${i + 1}/${count} articles...`);
            }
        }

        await client.query('COMMIT');

        console.log(`\n🎉 Successfully seeded ${count} articles!`);
        console.log(`   Article IDs: ${seededIds[0]} to ${seededIds[seededIds.length - 1]}`);
        console.log(`\n💡 To undo this seeding, run: node server/unseed-articles.js`);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error seeding articles:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

// Get count from command line argument or default to 50
const count = parseInt(process.argv[2]) || 50;
seedArticles(count);
