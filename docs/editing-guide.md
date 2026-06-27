# Editing the Glass Garden Rooms website

A guide for the team — written so you don't need to know anything about code.

---

## Where to go

Bookmark this URL: **https://glassgardenrooms.sanity.studio/**

This is your dashboard. It's where you go any time you want to change something on the website.

The first time you visit, log in with the email address that was invited. If you used Google to sign up, click the Google button. Otherwise use email and password. You'll only need to do this once per device.

---

## What you'll see

Once you're logged in, the dashboard has a menu down the left-hand side. Here's what each thing is for:

| Menu item | What lives here |
|---|---|
| 🏠 **Pages** | The text and headlines on each page of the site (Home, Products, FAQ, Contact, etc.) |
| 📦 **Catalogue** | Your products — Provence, Bordeaux, Premium Glass Room, hup!, Carports |
| ⭐ **Testimonials** | Customer reviews that appear on the home page |
| 📰 **Journal** | Blog posts |
| 🏗️ **Projects** | Completed installations (use for case studies) |
| ⚙️ **Site Settings** | Things that appear everywhere: phone number, email, address, opening hours, footer |

Click any of those to see what's inside. Nothing you click in this dashboard will damage anything — even if you delete something, you can restore it. Have a poke around.

---

## Making your first edit

Let's change a headline so you can see how it works.

1. Click **Pages** in the left menu, then **Home**
2. You'll see the home page broken into sections. The first one is "Hero" — open it
3. Find the field called **Headline**
4. Click in the box and edit the text however you like
5. In the top-right corner, click the green **Publish** button
6. Wait about 60 seconds, then open the website in another tab and refresh

That edit is now live on the real site, and anyone who visits will see it.

> **The italic trick.** If you want a word to appear in beautiful italic display style (like "Bring the *outdoors* in"), wrap it in asterisks: `Bring the *outdoors* in`. The site will render the word between the asterisks in the soft moss-green italic.

---

## Replacing a photo

Photos work the same way as text — they're just stored as a different kind of field.

1. Navigate to whichever page or product has the photo you want to change
2. Click on the existing photo
3. Click **Upload** and choose your new photo
4. Click in the **Alt text** box and type a short description of what's in the photo (this matters for accessibility and Google — example: *"Anthracite veranda over a stone patio at dusk"*)
5. Click **Publish**

The dashboard will automatically crop and resize the photo for different devices. You can drag the little circle on the photo to pick the most important part — the system uses that point when cropping for smaller screens.

---

## Adding a new blog post

This is what most clients edit the most. Here's the full sequence.

1. Click **Journal** in the left menu
2. Click **+ Create** (or the **+** icon at the top — looks like a plus sign)
3. Fill in the fields:
   - **Title** — the headline of your post
   - **Slug** — this fills in automatically from the title (it's the bit that appears in the URL, like `/journal/your-post-here/`). You can leave it alone.
   - **Published date** — defaults to today; change it if you want
   - **Author** — type your name or "Glass Garden Rooms"
   - **Volume label** — keep "Vol. 01" or change to something fitting
   - **Hero image** — upload a photo for the top of the post
   - **Short summary** — 1–2 sentences shown on the journal listing page
   - **Body** — this is where you write the post itself. You can use **bold**, *italic*, headings, bullet points, blockquotes, and drop images in between paragraphs.
4. When you're happy, click **Publish**

The post will appear on the website within a minute or so, on both the journal listing page and the home page.

> **Drafts.** You don't have to publish straight away. The dashboard saves your work automatically. Come back later, finish writing, and publish then.

> **Scheduling.** If you click the small arrow next to the Publish button, you can schedule a post for a specific date — it'll go live automatically.

---

## Adding a testimonial

1. Click **Testimonials** → **+ Create**
2. Fill in the customer's name, location, and quote
3. Choose how many stars (1–5)
4. If you want this to appear on the home page, switch on **Feature on home page**
5. Click **Publish**

If you have more than three featured testimonials, only the first three appear on the home page — the rest are still visible if anyone clicks through.

---

## Editing FAQs

1. Click **Pages** → **FAQ**
2. Each FAQ is grouped into sections (Quotes & payment, Installation, Features & options)
3. To add a question: click into a section, then under **Questions**, click **Add item**
4. Type the question, then write the answer in the **Answer** box
5. To remove a question: click the small **⋮** menu next to it and choose **Remove**
6. To reorder: grab the **⋮⋮** handle on the left of any question and drag it
7. Click **Publish**

---

## Changing site-wide things (phone number, address, hours)

These live in **Site Settings**. Change them once here, and they update everywhere on the website automatically — the footer, the contact page, anywhere they're displayed.

Things you can change here:
- Business name
- Phone / WhatsApp number
- Email address
- Showroom address
- Opening hours
- Trust badges (e.g. "NHBC accepted", "5-year warranty")
- Footer text and links
- Default SEO description (the summary Google shows)

---

## Publishing — what happens behind the scenes

When you click **Publish**:

1. Your change is saved to Sanity (the dashboard's content system)
2. Sanity tells the website to rebuild
3. The website rebuilds in about 30–60 seconds
4. Anyone who visits the site after that sees your change

If you make several edits in a row, each Publish triggers a rebuild — that's normal and fine.

You can refresh the website tab to check your edit went through. If you don't see it after a minute, give it another 30 seconds.

---

## What you can't edit (and why)

To keep the site looking polished and stop anything looking off, these stay with the developer:

- The **overall design** — colours, fonts, layout, spacing
- The **navigation menu structure** (the fact that there's a Products page, a Journal, etc.)
- **Brand-new page types** (a whole new section of the site)
- The **contact form behaviour** (it already sends straight into GoHighLevel — that part is locked in)
- The **3D configurator** integration

If you ever want any of these changed, just send us a message and we'll handle it.

---

## Common questions

**I made a mistake. Can I undo it?**
Yes — at the top of any document you'll see a **History** button (a small clock icon). Click it and you can see every previous version, and restore any of them with one click.

**I closed the tab before publishing — is my work lost?**
No. The dashboard saves drafts automatically every few seconds. Come back to the same item and your draft will still be there.

**Can two people edit at the same time?**
Yes — you'll see each other's cursors live. If two people edit the same field, the last one to publish wins.

**The website doesn't show my change.**
Wait 60 seconds, then refresh with `Ctrl + F5` (Windows) or `Cmd + Shift + R` (Mac) to bypass your browser cache. If still nothing after 2 minutes, contact us.

**I want to remove something temporarily without deleting it.**
For a testimonial, blog post, or product — open it and click the **⋮** menu in the top-right, then **Unpublish**. It stays in your dashboard but disappears from the website. Click **Publish** again to bring it back.

**Can I see drafts before they go live?**
Yes — there's a small switch in the top-left labelled **Drafts**. With it on, you'll see your unpublished changes in the dashboard. The website won't show them until you hit Publish.

---

## When something doesn't work

Send a WhatsApp or email — describe what you were trying to do and what you saw. A screenshot helps. We'll usually reply the same day.

If the live website is broken or showing the wrong thing, **don't panic** — it's almost always something we can fix in a minute, and every version of every page is saved in History so nothing is ever truly lost.

---

*Last updated: 2026-06-27*
