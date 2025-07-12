'use client';

import { useState } from 'react';

export default function TestAccountsPage() {
  const [userId, setUserId] = useState('8a2a995c-cbb6-4b28-8dab-b465c018e035');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testAccounts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/test-accounts?userId=${userId}`);
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: '요청 실패', details: error });
    }
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">계정 조회 테스트</h1>
      
      <div className="mb-4">
        <label className="block mb-2">User ID:</label>
        <input
          type="text"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>

      <button
        onClick={testAccounts}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? '조회 중...' : '계정 조회'}
      </button>

      {result && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">조회 결과:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}