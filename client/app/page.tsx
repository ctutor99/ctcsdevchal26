'use client';

import { FormEvent, useEffect, useState } from 'react';
import type { Restaurant, Visit } from '@/lib/types';

export default function HomePage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [summary, setSummary] = useState({ thisMonth: 0, thisYear: 0 });
  const [showForm, setShowForm] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState('');
  const [name, setName] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [address, setAddress] = useState('');
  const [rating, setRating] = useState('');
  const [amount, setAmount] = useState('');
  const [visitedAt, setVisitedAt] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      const responses = await Promise.all([
        fetch('/api/restaurants'),
        fetch('/api/visits'),
        fetch('/api/visits/summary'),
      ]);
      const [restaurantData, visitData, summaryData] = await Promise.all(
        responses.map((response) => response.json())
      );
      const failedIndex = responses.findIndex((response) => !response.ok);

      if (failedIndex !== -1) {
        const data = [restaurantData, visitData, summaryData][failedIndex];
        setError(data.error ?? 'Could not load data');
        return;
      }

      setRestaurants(restaurantData);
      setVisits(visitData);
      setSummary(summaryData);
    }

    loadData().catch(() => setError('Could not load data'));
  }, []);

  async function refreshVisits() {
    const [visitResponse, summaryResponse] = await Promise.all([
      fetch('/api/visits'),
      fetch('/api/visits/summary'),
    ]);
    const [visitData, summaryData] = await Promise.all([
      visitResponse.json(),
      summaryResponse.json(),
    ]);

    if (!visitResponse.ok || !summaryResponse.ok) {
      setError(visitData.error ?? summaryData.error ?? 'Could not load visits');
      return;
    }

    setVisits(visitData);
    setSummary(summaryData);
  }

  async function addVisit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    let restaurantId = Number(selectedRestaurant);

    if (selectedRestaurant === 'new') {
      const restaurantResponse = await fetch('/api/restaurants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          cuisine: cuisine || null,
          address: address || null,
          rating: rating === '' ? null : Number(rating),
        }),
      });
      const restaurant = await restaurantResponse.json();

      if (!restaurantResponse.ok) {
        setError(restaurant.error);
        return;
      }

      restaurantId = restaurant.id;
      setRestaurants([...restaurants, restaurant]);
      setSelectedRestaurant(String(restaurant.id));
    }

    const visitResponse = await fetch('/api/visits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        restaurantId,
        amount: Number(amount),
        visitedAt,
      }),
    });
    const visit = await visitResponse.json();

    if (!visitResponse.ok) {
      setError(visit.error);
      return;
    }

    await refreshVisits();
    setSelectedRestaurant('');
    setName('');
    setCuisine('');
    setAddress('');
    setRating('');
    setAmount('');
    setVisitedAt('');
    setShowForm(false);
  }

  async function deleteVisit(id: number) {
    const response = await fetch(`/api/visits/${id}`, { method: 'DELETE' });

    if (response.ok) {
      await refreshVisits();
      setError('');
    } else {
      const data = await response.json();
      setError(data.error);
    }
  }

  return (
    <div>
      <h2 className="mb-4 text-lg font-medium">Restaurants</h2>
      <ul className="space-y-3">
        {restaurants.map((restaurant) => (
          <li
            key={restaurant.id}
            className="rounded-lg border border-gray-200 bg-white p-4"
          >
            <div className="flex items-baseline justify-between">
              <span className="font-medium">{restaurant.name}</span>
              <span className="text-sm text-gray-500">
                {restaurant.rating}★
              </span>
            </div>
            <div className="mt-1 text-sm text-gray-600">
              {restaurant.cuisine} · {restaurant.address}
            </div>
          </li>
        ))}
      </ul>

      <hr className="my-8 border-gray-300" />

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-medium">Visits</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded bg-blue-600 px-3 py-2 text-sm text-white"
        >
          ADD
        </button>
      </div>

      {showForm && (
        <form onSubmit={addVisit} className="mb-4 space-y-2 rounded-lg border bg-white p-4">
          <select
            value={selectedRestaurant}
            onChange={(event) => setSelectedRestaurant(event.target.value)}
            required
            className="w-full rounded border p-2"
          >
            <option value="">Choose a restaurant</option>
            {restaurants.map((restaurant) => (
              <option key={restaurant.id} value={restaurant.id}>
                {restaurant.name}
              </option>
            ))}
            <option value="new">Add new restaurant</option>
          </select>

          {selectedRestaurant === 'new' && (
            <>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Name"
                required
                className="w-full rounded border p-2"
              />
              <input
                value={cuisine}
                onChange={(event) => setCuisine(event.target.value)}
                placeholder="Cuisine"
                className="w-full rounded border p-2"
              />
              <input
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                placeholder="Address"
                className="w-full rounded border p-2"
              />
              <input
                type="number"
                value={rating}
                onChange={(event) => setRating(event.target.value)}
                placeholder="Rating"
                min="0"
                max="5"
                step="0.1"
                className="w-full rounded border p-2"
              />
            </>
          )}

          <input
            type="number"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="Amount"
            min="0.01"
            step="0.01"
            required
            className="w-full rounded border p-2"
          />
          <input
            type="date"
            value={visitedAt}
            onChange={(event) => setVisitedAt(event.target.value)}
            required
            className="w-full rounded border p-2"
          />
          <button className="rounded bg-blue-600 px-3 py-2 text-sm text-white">
            SAVE
          </button>
        </form>
      )}

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
        Spent ${summary.thisMonth.toFixed(2)} this month, ${summary.thisYear.toFixed(2)} this year
      </div>

      <ul className="space-y-3">
        {visits.map((visit) => (
          <li
            key={visit.id}
            className="rounded-lg border border-gray-200 bg-white p-4"
          >
            <div className="flex items-baseline justify-between">
              <span className="font-medium">{visit.restaurantName}</span>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">${visit.amount.toFixed(2)}</span>
                <button
                  onClick={() => deleteVisit(visit.id)}
                  className="text-sm text-red-600"
                >
                  DELETE
                </button>
              </div>
            </div>
            <div className="mt-1 text-sm text-gray-600">{visit.visitedAt}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
