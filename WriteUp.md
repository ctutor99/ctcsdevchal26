# Write-up

> This is the skeleton - replace everything in blockquotes with your own words
> and delete the prompts as you go. Aim for **~300 words** across the four
> questions; the route reference below can be as long as it needs to be.
>
> Write it like you're handing the work to a teammate. We'd rather read an
> honest "I ran out of time on X and here's what I'd do" than a polished list of
> accomplishments. **Submit this even if you didn't finish** - see CHALLENGE.md.

## 1. What did you build for Part B, and why that?

> What made you pick it over everything else you could have built? This is the
> question we care most about - the _why_ matters more than the _what_.

What I built: an API and matching UI for the already existing "visits" table, along with a monthly/yearly spend summary and basic "ADD" and "DELETE" buttons to the frontend. 

My "why" and "why I built this instead of anything else" comes down to the fact that I actually wanted to finish a basic working version of the app first, instead of adding new features that aren't in the app description. The very first line of the writeup says that this program should be "A fullstack app for tracking restaurants, visits, and how much Brennen spends eating". The frontend that remained after building A1-A3 did not do that in the slightest. But, the thing is, we have already implemented 80 percent of the "tracking visits" and "How much Brennen spends eating" parts. We just need it to build the API and UI inorder to access it. 



## 2. What did you decide, and what did you rule out?

> Route shapes, data model, where the logic lives, what you deliberately didn't
> do. Name a tradeoff you're not sure you got right.

I kept the routes simple: GET and POST for /api/visits, DELETE for /api/
visits/:id, and a separate GET route for the spending summary. A visit stores a
restaurant ID, amount, and date. Validation lives in the API, while the database
calculates the totals. For the things I left out, they all pertain to the things unnececary for a first version of a app like this. I never used the "notes" column in the sql database for that reason. 

The main tradeoff I am not sure I got right is that of me seperating the "restaraunts" and "visits" through different routes. They use the same API, but if one route fails, the other one could still be created. Basically this means you could add a visit to a restaraunt, and if the restaraunt route fails, only a visit is added and it doesn't go to your list of visited restaraunts. 

## 3. Where did you cut corners?

> What would you fix first with another day?

The problem with my code is, while I built the visits feature into the existing database structure, the two routes are ran seperately and handle errors seperately. This means If I caught an error on one part of the restaraunts list, or vice versa, the other list will update while one doesnt. With another day, I would combine the two, in an database transaction that either makes both of them update or none after any adition. 

---

## Part B: routes

> Every endpoint you added, with its request and response shapes, so we can
> exercise it without reverse-engineering your code. Add or remove rows as
> needed; delete this section if your Part B added no routes.

| Method and path           | What it does                 | Success              | Errors                |
| --------------------------| ---------------------------- | ---------------------| ----------------------|
| `GET /api/visits`.        |Lists visits.                 | `200` + visit array  | `500` if server error |
| `POST /api/visits`        |Creates a visit.              | `201` + created visit| `400` on invalid input, 404 on restaraunt not found |
| `DELETE /api/visits/:id`  | deletes a visit              | `204` with no body   | `404` visit not found |
| `GET /api/visits/summary` | Current month + year spending| `200` + summary      | `500` on server error.|


**`POST /api/visits`**

```jsonc
// request
  {
    "restaurantId": 1,
    "amount": 42.50,
    "visitedAt": "2026-09-09"
  }

  // 201 response
  {
    "id": 4,
    "restaurantId": 1,
    "restaurantName": "The Rusty Spoon",
    "amount": 42.5,
    "visitedAt": "2026-09-09",
    "createdAt": "2026-09-09T18:10:38.911Z" // this one is not used
  }

  **`GET /api/visits`**
  ```json
  [
    {
      "id": 4,
      "restaurantId": 1,
      "restaurantName": "The Rusty Spoon",
      "amount": 42.5,
      "visitedAt": "2026-09-09",
      "createdAt": "2026-09-09T18:10:38.911Z"
    }
  ]

  **`GET /api/visits/summary`**
  {
    "thisMonth": 42.5,
    "thisYear": 162.25
  }

  Errors return:
  {
    "error": "Error message"
  }

## Schema changes

> Any migrations you added (`002_*.sql`, ...), new tables or columns, and
> anything a reviewer needs to run beyond `./setup.sh`. Write "none" if there
> were none.

None!

## How I verified this

> How you checked your work - the happy paths _and_ the failures. `curl`
> commands, a Postman collection, a scratch script, screenshots: whatever you
> actually used. Paste the commands.
>
> This is much faster for us to review than working it out ourselves, and it's
> how you show you checked the edge cases.

**Part A** - the contract table in CHALLENGE.md, every row including the error
cases:

```bash
# e.g.
curl -i http://localhost:3000/api/restaurants          # 200 + array
curl -i http://localhost:3000/api/restaurants/99999    # 404
curl -i http://localhost:3000/api/restaurants/abc      # 404
curl -i -X POST http://localhost:3000/api/restaurants \
  -H 'Content-Type: application/json' \
  -d '{"name":"Out Of Range","rating":6}'              # 400
```

**Part B** - the equivalent cases for what you built:

```bash

```

## Known issues / what I'd do next




> Anything broken, unfinished, or that you know is wrong. Being upfront here
> costs you nothing and tells us a lot.
