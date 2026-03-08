# CrustData — Real-Time B2B Company & People Data API

- **Website**: https://crustdata.com/
- **Docs**: https://docs.crustdata.com/
- **Demo**: https://crustdata.com/demo
- **Hackathon Credits**: $2,000 for ALL participants
- **Background**: YC F24, $4M ARR in 7 months
- **Judge**: Abhilash Chowdhary (Co-Founder)

---

## What It Is

Real-time B2B data broker providing company intelligence via API. 16+ datasets including headcount, reviews, social media, web traffic, app store data, news.

## Authentication

```
Authorization: Token $token    # enrichment APIs
Authorization: Bearer $token   # search APIs
```

## API Endpoints

### 1. Company Enrichment
```
GET /screener/company?company_domain=hubspot.com,google.com
GET /screener/company?company_domain=swiggy.com&fields=company_name,headcount.headcount
```

### 2. Company Screening / Discovery
```
POST /screener/screen/
```
Filter by: investment amount, headcount, country, employee skills, etc.

### 3. Company Search
```
POST /screener/company/search
```
Filter by: headcount ranges, revenue, country, funding activity. Max 25 results/page.

### 4. People Enrichment
```
GET /screener/person/enrich?linkedin_profile_url=https://www.linkedin.com/in/dtpow/
```

### 5. Social Posts
```
GET /screener/social_posts?person_linkedin_url=https://linkedin.com/in/abhilash-chowdhary&page=1
```

### 6. People Search
```
POST /screener/person/search
```
Filter by: INDUSTRY, COMPANY_HEADCOUNT, SENIORITY_LEVEL, KEYWORD, CURRENT_COMPANY, CURRENT_TITLE.

## Data Categories

- **Firmographics**: company name, HQ, funding, valuation, industries, investors
- **Founder Background**: names, education, previous companies, emails
- **Revenue**: estimated bounds (USD)
- **Headcount**: total + by function (engineering, sales, ops, HR) + time series + growth
- **Employee Skills**: skill names, counts, distribution by proficiency
- **Reviews & Ratings**: overall, culture, diversity, WLB, compensation + time series
- **Web Traffic**: monthly visitors, source breakdowns
- **Job Listings**: openings by function + growth metrics
- **Ads**: Meta ad counts, URLs
- **SEO**: organic/paid rankings, clicks, budget
- **Social Media**: posts, engagement, reactors
- **News**: articles with links, publishers, dates

## Additional Features (not fully documented)

- **Watcher**: monitoring/alerting
- **Advanced Search**: expanded search
- **Web Search API** / **Web Fetch API**

## Hackathon Relevance

Stretch goal: Dispatch された worker や asset の企業データを Dashboard に表示。審査員 Abhilash が CrustData co-founder なので visible に使えれば加点。
