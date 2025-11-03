# Printify Integration Guide for Your Shopify Store

## 🎯 Quick Setup for Your 2 Shirt SKUs

### Step 1: Install Printify App

1. Go to your **Shopify Admin**
2. Navigate to **Apps** → **Shopify App Store**
3. Search for **"Printify"**
4. Click **Add app** and authorize the installation
5. You'll be redirected to Printify's dashboard

---

### Step 2: Connect Printify to Your Shopify Store

1. In the Printify dashboard, go to **My Stores**
2. Click **Connect Store**
3. Select **Shopify**
4. Authorize the connection
5. Verify your store appears as "Connected"

---

### Step 3: Create/Publish Your 2 Shirt Products in Printify

#### For Each Shirt:

1. **In Printify Dashboard**:
   - Click **Catalog** → Choose your shirt product (e.g., "Bella+Canvas 3001")
   - Upload your design
   - Select sizes to offer (S, M, L, XL, etc.)
   - Set your retail price
   - Add product title and description

2. **Publish to Shopify**:
   - Click **Publish to Store**
   - Select your connected Shopify store
   - Choose **"Publish as new product"** or **"Update existing product"**
   - Click **Publish**

3. **Printify automatically creates**:
   - Product listing in Shopify
   - Variants for each size
   - SKUs for each variant
   - Product images
   - Inventory tracking (handled by Printify)

---

### Step 4: Configure Products in Shopify (After Publishing from Printify)

Once Printify publishes your products to Shopify:

1. Go to **Shopify Admin** → **Products**
2. Find your Printify products
3. For each product:
   - ✅ Verify **Status** = Active
   - ✅ Check **Sales channels** → Ensure "Online Store" is checked
   - ✅ Add product **Tags**:
     - `light` (for Light Humor collection)
     - `dark` (for Dark Humor collection)
   - ✅ Verify **Variants** show all sizes with SKUs
   - ✅ Check **Inventory** is managed by Printify
   - Click **Save**

---

### Step 5: Enable SKU Display in Your Theme (Optional)

Currently, SKU display is disabled in your product page. To show SKUs:

1. Go to **Online Store** → **Themes** → **Customize**
2. Navigate to **Products** → **Default product**
3. In the left sidebar, find the **Product information** section
4. Look for the **"SKU"** block (it may be hidden/disabled)
5. Enable it by toggling it on or dragging it into the active blocks
6. Click **Save**

---

## 🎨 Theme Compatibility

Your theme is **fully compatible** with Printify products and includes:

### ✅ Already Built-in:
- **Variant picker** – Customers can select size/color
- **Product images** – Gallery displays Printify mockups
- **Add to cart** – Works with all Printify variants
- **SKU display** – Available (just needs to be enabled)
- **Inventory status** – Shows "In stock" / "Out of stock"
- **Price display** – Shows your retail prices
- **Mobile responsive** – Works on all devices

### No Code Changes Needed!
All Printify functionality works automatically once products are published.

---

## 🚨 Important Printify Settings

### In Printify Dashboard:

1. **Publishing Settings** (Settings → Store Settings):
   - ✅ Enable **"Auto-fulfill orders"** – Orders go to Printify automatically
   - ✅ Set **"Product status on publish"** → Active
   - ✅ Enable **"Update product details"** – Keeps prices/variants synced

2. **Product Settings**:
   - ✅ Use unique SKUs for each variant
   - ✅ Enable inventory tracking
   - ✅ Set handling times (appears on product pages)

---

## 🛍️ Customer Purchase Flow

1. **Customer visits your store** → Sees product
2. **Selects size** → Variant picker updates price/availability
3. **Adds to cart** → Order placed in Shopify
4. **Order syncs to Printify** → Printify receives order automatically
5. **Printify fulfills** → Prints and ships directly to customer
6. **Tracking updates** → Synced back to Shopify

---

## 📦 Example Product Structure (After Printify Publishes)

```
Product: "Existential Crisis" T-Shirt
├── Variant: Small (SKU: EC-S-001)
├── Variant: Medium (SKU: EC-M-001)
├── Variant: Large (SKU: EC-L-001)
├── Variant: XL (SKU: EC-XL-001)
└── Variant: 2XL (SKU: EC-2XL-001)

Tags: dark, new
Price: $28.00
Inventory: Managed by Printify
Fulfillment: Automatic via Printify
```

---

## ✅ Verification Checklist

After setting up your 2 shirts:

- [ ] Printify app installed and connected to Shopify
- [ ] Both shirt designs uploaded to Printify
- [ ] Both products published from Printify → Shopify
- [ ] Products appear in Shopify admin under Products
- [ ] Products are Active and published to Online Store channel
- [ ] Products have correct tags (`light` or `dark`)
- [ ] All size variants show SKUs
- [ ] Products appear on your storefront
- [ ] Variant picker works (select different sizes)
- [ ] Add to cart works for all sizes
- [ ] Test order processes correctly

---

## 🔗 Useful Links

- **Printify Help Center**: https://help.printify.com/
- **Shopify + Printify Integration**: https://help.printify.com/hc/en-us/articles/360019718894
- **Managing Variants**: https://help.printify.com/hc/en-us/articles/360020176913

---

## 🎯 Next Steps After Setup

Once your 2 shirts are live:

1. **Test the full flow**:
   - Place a test order
   - Verify it appears in Printify dashboard
   - Check fulfillment process

2. **Organize products**:
   - Add to collections (Light Humor / Dark Humor)
   - Feature on homepage using your Duo Hero section
   - Add to featured products sections

3. **Optimize product pages**:
   - Add detailed descriptions
   - Enable size guide (if you have one)
   - Add trust badges
   - Set up product reviews

---

## 🚨 Common Issues & Fixes

### "Product not showing on storefront"
**Fix**: Go to product in Shopify admin → Check "Sales channels" → Enable "Online Store"

### "Variants missing SKUs"
**Fix**: In Printify, ensure SKUs are set before publishing. Republish product from Printify.

### "Out of stock" showing incorrectly
**Fix**: Check Printify inventory settings. Printify products should always show as in stock unless manually disabled.

### "Orders not going to Printify"
**Fix**: Verify Printify app connection in Shopify → Apps. Reconnect if needed.

---

## 💡 Pro Tips

1. **Use Printify's mockup generator** – Creates professional product photos automatically
2. **Set up shipping profiles** – Printify handles shipping, but you control displayed rates
3. **Enable product reviews** – Use Shopify's review app or third-party apps
4. **Create bundles** – Offer both shirts together with a discount
5. **Use your existing collections** – Tag products appropriately for Light/Dark humor categories

---

**You're all set!** Your theme is Printify-ready. Just install the app and publish your 2 shirts. 🚀

