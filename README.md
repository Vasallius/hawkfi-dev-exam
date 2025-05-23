# Frontend Technical Exam

### Rules:

- A starting Next.js repository is provided, please fork it → https://github.com/TheoInTech/hawkfi-dev-exam
- You will need to learn, install and use the Orca Legacy SDK → https://github.com/orca-so/whirlpools/tree/main/legacy-sdk/whirlpool
- This test is intended **only** for Solana Mainnet network - no need to bother with Devnet support. You will need to setup the connection and RPC (can use any).
- Use MUI Material UI components (already setup)→ https://mui.com/material-ui/getting-started/
- No need to strictly follow the design but it should be usable.

### Tasks:

- In HawkFi, we interact with different LP protocols’ SDKs to help users have a better UI/UX when creating positions. Your task is to create one of the sections in our “Create Position” flow.
  See this figjam: https://www.figma.com/board/cOlFVle0YPIfUuTvsvpLw1/Untitled?node-id=0-1&t=RGdj6QvnQxZP7Ujd-1
- See it in action for reference: https://www.hawkfi.ag/orca/Czfq3xZZDmsdGdUyrNLtRhGc47cXcZtLG4crryfu44zE
- Select only one pool to integrate.
- Display the current pool price based on the active tick. Auto-refresh it every 10 seconds. This should also move the dashed line current price in the visualization.
- Add an interactive slider to change the price range. Min should not overlap Max, vice versa. Initial price range should be +/- 10% from the current price.
- Display the Liquidity Distribution (in gray) with the current price (dashed line). It should adapt and transform based on the selected price range.
- Display the start and end tick prices on the liquidity distribution. This also changes upon selecting a new min/max price.
- Add input boxes for manually typing in the min and max price. Should display how far (in %) it is from the current price.
- Be able to reset to the default / initial price range.
- Performance and adaptive rendering speed will be judged as well.
- **Bonus:** Can select up to 3 pools, jump into the other very quickly and smoothly.

### Submission guidelines:

- Solution must be uploaded onto a public/private Github repository
  - You may host on Vercel (or any other hosting service)
  - Examiners must be able to easily go to the vercel build
  - An updated `README` file isn’t required but encouraged.
- Submit your solution within 4 days via email to `ea@hawksight.co` and `tr@hawksight.co`. If an extension is needed, let examiners know as soon as possible.
- Once we verify that you passed the exam, examiners will contact you for the final interview where you’ll present your solution.
