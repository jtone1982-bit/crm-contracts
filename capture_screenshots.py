import asyncio
from playwright.async_api import async_playwright
from pathlib import Path

screenshots_dir = Path('/Users/a1/projects/crm-contracts/public/screenshots')
screenshots_dir.mkdir(parents=True, exist_ok=True)

async def capture():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={'width': 1280, 'height': 800})
        page = await context.new_page()
        
        # Login as test manager
        await page.goto('https://tone-crm.ru/login')
        await page.fill('input[type="email"]', 'test@crm.local')
        await page.fill('input[type="password"]', '123456')
        await page.click('button:has-text("Войти")')
        await page.wait_for_load_state('networkidle')
        await asyncio.sleep(1)
        
        # Screenshot 1: manager candidates table
        await page.goto('https://tone-crm.ru/candidates')
        await page.wait_for_load_state('networkidle')
        await asyncio.sleep(1)
        await page.screenshot(path=str(screenshots_dir / 'manager-table.png'))
        print('Saved manager-table.png')
        
        # Screenshot 2: candidate card
        await page.click('button:has-text("+798")')  # phone button
        await asyncio.sleep(1)
        await page.screenshot(path=str(screenshots_dir / 'candidate-card.png'))
        print('Saved candidate-card.png')
        
        await browser.close()

asyncio.run(capture())
print(f'All screenshots saved to {screenshots_dir}')
