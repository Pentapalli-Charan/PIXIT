# Demo Video Script
**Target Duration:** 3-5 Minutes.

## Preparation Checklist
- Have 2 distinct test images ready (e.g., a face portrait and a landscape nature shot) on your desktop.
- Ensure the local Streamlit server is running without errors.

---

### [0:00 - 0:30] Introduction & Registration
**Visuals:** Start on the landing page of the application in Light Mode.
**Narrator/Voiceover:** "Welcome to the AI-Powered Stylization platform. Today we'll showcase our end-to-end user journey. Let's start by exploring the dark mode toggle..."
*(Action: Click the glowing lightbulb to swap to Dark Mode for a sleek vibe)*.
**Action:** Click the top-right 'Login' button. Swiftly navigate to the 'Sign Up' tab.
**Narrator:** "First, we'll create a new secure account."
*(Action: Type in a test username, fake email, and demonstrate the password validation by typing a weak password first to show the error trigger, then correct it to a strong one).*

### [0:30 - 1:30] Image Upload & Stylization
**Visuals:** Logged in. The main dashboard appears.
**Narrator:** "Now authenticated, we upload our base image."
*(Action: Use the file uploader to drop the portrait image).*
**Narrator:** "We're offered three core styles. Let's apply the 'Classic Cartoon' filter at a Medium intensity."
*(Action: Select the options and click 'Stylize Image'. The loading spinner triggers for ~1 second).*
**Narrator:** "Our OpenCV backend algorithm instantaneously processes the pixels using Bilateral Filters and K-Means segmentation. Here is our watermarked free preview!"
*(Action: Scroll smoothly to reveal the split-panel before/after preview).*

### [1:30 - 2:30] Mock Payment & Download
**Visuals:** The user is looking at the watermarked image.
**Narrator:** "To extract the high-resolution original image, we integrate a mock Razorpay gateway."
*(Action: Click 'Remove Watermark & Download HD'. The side panel slides open).*
**Narrator:** "A unique backend Order ID initiates."
*(Action: Click 'Confirm Payment'. Briefly show the success banner).*
**Narrator:** "Once the Webhook cryptographic signature validates, our premium download link unlocks instantly."
*(Action: Click Download, showing the file saving to the desktop).*

### [2:30 - 3:30] Exploring the History Dashboard
**Visuals:** Navigate to the Header and click the newly updated top-right circular Profile Avatar.
**Narrator:** "To manage our purchases, we navigate seamlessly to our centralized Profile page."
*(Action: Scroll through 'Account Overview', showing standard stats).*
*(Action: Switch to the 'Processing History' tab. Filter the gallery specifically to 'Classic Cartoon' or click Sort by Date).*
**Narrator:** "Every stylization logs securely to our SQLite backend, enabling bulk actions."
*(Action: Briefly click 'Download All' and showcase the `.ZIP` file generation).*
*(Action: Finally, demonstrate hitting 'Delete' on a single image and verifying it vanishes from the grid).*

### [3:30 - 4:00] Conclusion
**Visuals:** Return to main image generator. Hit "Logout".
**Narrator:** "And finally, we log out, cleanly scrubbing our browser session cookies via parameterized URL routing. That concludes the tour of the AI Stylization platform!"
*(Action: Video fades to black with Team/GitHub link).*
