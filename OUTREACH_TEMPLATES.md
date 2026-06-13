# DhabaRoute Outreach Templates

## WhatsApp / SMS Message Templates

### Template A — Short (Owner who doesn't know the site exists)

```
Hi, this is DhabaRoute. Your dhaba is already listed on our site at dhabaroute.com — truckers and highway drivers use it to find Indian food on the road.

Claim your free listing to update your hours, menu, and photos:
👉 dhabaroute.com/for-owners?ref=whatsapp

Takes 2 minutes. No cost.
```

---

### Template B — With Punjabi (warmer, for Punjabi-owned stops)

```
ਸਤ ਸ੍ਰੀ ਅਕਾਲ ji 🙏

Your dhaba is listed on DhabaRoute — truckers all over the U.S. use it to find Indian food on the highway.

Claim your free listing to make sure your hours and menu are right:
👉 dhabaroute.com/for-owners?ref=whatsapp

Free to start. No apps to download.
```

---

### Template C — Follow-up / second touchpoint

```
Hi again from DhabaRoute. Just checking in — your dhaba is getting views from drivers on the route.

If you want to update your info or add your menu, it takes 2 minutes:
👉 dhabaroute.com/claim?ref=whatsapp

Happy to help if you have questions.
```

---

### Template D — Email subject lines (if emailing)

- "Your dhaba is on DhabaRoute — claim your free listing"
- "Truckers are finding [Dhaba Name] on DhabaRoute"
- "Free listing claim: [Dhaba Name] on DhabaRoute"

---

## UTM Parameters

All outreach links should use `?ref=` so you can see which channel drives traffic in Vercel Analytics.

| Channel | Parameter | Example URL |
|---------|-----------|-------------|
| WhatsApp | `?ref=whatsapp` | `dhabaroute.com/for-owners?ref=whatsapp` |
| SMS | `?ref=sms` | `dhabaroute.com/for-owners?ref=sms` |
| Email | `?ref=email` | `dhabaroute.com/for-owners?ref=email` |
| In-person | `?ref=inperson` | `dhabaroute.com/claim?ref=inperson` |
| Telegram | `?ref=telegram` | `dhabaroute.com/for-owners?ref=telegram` |

### Claim links with dhaba slug (personalized)

When you know the slug, send a direct claim link so owners land on the right page:

```
dhabaroute.com/claim?dhaba=punjabi-dhaba-sanders&ref=whatsapp
```

This pre-fills the form with their dhaba name.

---

## Outreach Sequencing

**Day 1:** Send Template A (or B for Punjabi stops)
- Include direct claim link: `dhabaroute.com/claim?dhaba=SLUG&ref=whatsapp`

**Day 5 (if no response):** Send Template C as follow-up

**Day 14 (if no response):** Stop — don't over-message.

---

## Finding Contact Info

Most dhabas in `data/dhabas.json` have a `phone` field. Use that to WhatsApp or call.

To get a list of all dhabas with phone numbers, run:

```bash
node -e "
const data = JSON.parse(require('fs').readFileSync('data/dhabas.json','utf8'));
const dhabas = data.dhabas || data;
dhabas.filter(d => d.phone).forEach(d => {
  console.log(d.title + ' | ' + d.phone + ' | dhabaroute.com/claim?dhaba=' + d.slug + '&ref=whatsapp');
});
" > outreach-contacts.txt
```
