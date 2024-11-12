'use client'
import { useState } from 'react';

export default function BWMCalculator() {
  const [criteria, setCriteria] = useState([
    { id: 1, name: 'Price' },
    { id: 2, name: 'Quality' },
    { id: 3, name: 'Durability' }
  ]);
  
  const [bestCriterion, setBestCriterion] = useState(null);
  const [worstCriterion, setWorstCriterion] = useState(null);
  const [bestToOthers, setBestToOthers] = useState({});
  const [othersToWorst, setOthersToWorst] = useState({});
  const [results, setResults] = useState(null);

  // Calculate consistency index based on scale
  const calculateConsistencyIndex = (maxValue) => {
    const consistencyIndices = {
      1: 0.00, 2: 0.44, 3: 1.00, 4: 1.63, 5: 2.30,
      6: 3.15, 7: 3.73, 8: 4.23, 9: 4.35
    };
    return consistencyIndices[Math.floor(maxValue)] || 4.35;
  };

  const calculateWeights = () => {
    if (!bestCriterion || !worstCriterion) {
      alert("Please select best and worst criteria");
      return;
    }

    // Calculate weights using geometric mean method
    const weights = criteria.map(criterion => {
      const bestToThis = bestToOthers[criterion.id] || 1;
      const thisToWorst = othersToWorst[criterion.id] || 1;
      return {
        id: criterion.id,
        value: 1 / Math.sqrt(bestToThis * thisToWorst)
      };
    });

    // Normalize weights
    const sumWeights = weights.reduce((sum, w) => sum + w.value, 0);
    const normalizedWeights = weights.map(w => ({
      id: w.id,
      weight: w.value / sumWeights
    }));

    // Calculate consistency ratio
    const maxValue = Math.max(
      ...Object.values(bestToOthers),
      ...Object.values(othersToWorst)
    );
    const CI = calculateConsistencyIndex(maxValue);

    // Calculate maximum violation
    let maxViolation = 0;
    criteria.forEach((ci) => {
      criteria.forEach((cj) => {
        if (ci.id !== cj.id) {
          const wi = normalizedWeights.find(w => w.id === ci.id)?.weight || 0;
          const wj = normalizedWeights.find(w => w.id === cj.id)?.weight || 0;
          
          if (ci.id === bestCriterion) {
            const violation = Math.abs(bestToOthers[cj.id] * wj - wi);
            maxViolation = Math.max(maxViolation, violation);
          }
          if (cj.id === worstCriterion) {
            const violation = Math.abs(othersToWorst[ci.id] * wi - wj);
            maxViolation = Math.max(maxViolation, violation);
          }
        }
      });
    });

    const consistencyRatio = CI ? (maxViolation / CI) : 0;

    setResults({ 
      weights: normalizedWeights,
      consistencyRatio,
      isConsistent: consistencyRatio <= 0.1
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Best-Worst Method Calculator</h1>
      
      {/* Criteria Management */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Step 1: Define Criteria</h2>
        {criteria.map(criterion => (
          <div key={criterion.id} className="flex items-center gap-4 mb-2">
            <input
              type="text"
              value={criterion.name}
              onChange={(e) => {
                setCriteria(criteria.map(c =>
                  c.id === criterion.id ? { ...c, name: e.target.value } : c
                ));
              }}
              className="border p-2 rounded"
            />
            <button
              onClick={() => {
                if (criteria.length > 2) {
                  setCriteria(criteria.filter(c => c.id !== criterion.id));
                  if (bestCriterion === criterion.id) setBestCriterion(null);
                  if (worstCriterion === criterion.id) setWorstCriterion(null);
                }
              }}
              className="text-red-600 hover:text-red-800 disabled:opacity-50"
              disabled={criteria.length <= 2}
            >
              Remove
            </button>
          </div>
        ))}
        <button
          onClick={() => {
            const newId = Math.max(...criteria.map(c => c.id), 0) + 1;
            setCriteria([...criteria, { id: newId, name: `Criterion ${newId}` }]);
          }}
          className="text-blue-600 hover:text-blue-800"
        >
          Add Criterion
        </button>
      </div>

      {/* Best-Worst Selection */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Step 2: Select Best and Worst Criteria</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-2">Best Criterion</label>
            <select
              value={bestCriterion || ''}
              onChange={(e) => setBestCriterion(Number(e.target.value))}
              className="w-full border p-2 rounded"
            >
              <option value="">Select best criterion</option>
              {criteria.map(criterion => (
                <option key={criterion.id} value={criterion.id}>
                  {criterion.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-2">Worst Criterion</label>
            <select
              value={worstCriterion || ''}
              onChange={(e) => setWorstCriterion(Number(e.target.value))}
              className="w-full border p-2 rounded"
            >
              <option value="">Select worst criterion</option>
              {criteria.map(criterion => (
                <option key={criterion.id} value={criterion.id}>
                  {criterion.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Comparisons */}
      {bestCriterion && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Step 3: Best-to-Others Comparisons</h2>
          <p className="mb-2 text-sm text-gray-600">
            Compare the best criterion to others (1-9 scale)
          </p>
          {criteria.map(criterion => (
            criterion.id !== bestCriterion && (
              <div key={criterion.id} className="flex items-center gap-4 mb-2">
                <span className="w-32">{criterion.name}</span>
                <input
                  type="number"
                  min="1"
                  max="9"
                  value={bestToOthers[criterion.id] || ''}
                  onChange={(e) => setBestToOthers({
                    ...bestToOthers,
                    [criterion.id]: Number(e.target.value)
                  })}
                  className="border p-2 rounded w-24"
                />
              </div>
            )
          ))}
        </div>
      )}

      {worstCriterion && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Step 4: Others-to-Worst Comparisons</h2>
          <p className="mb-2 text-sm text-gray-600">
            Compare other criteria to the worst criterion (1-9 scale)
          </p>
          {criteria.map(criterion => (
            criterion.id !== worstCriterion && (
              <div key={criterion.id} className="flex items-center gap-4 mb-2">
                <span className="w-32">{criterion.name}</span>
                <input
                  type="number"
                  min="1"
                  max="9"
                  value={othersToWorst[criterion.id] || ''}
                  onChange={(e) => setOthersToWorst({
                    ...othersToWorst,
                    [criterion.id]: Number(e.target.value)
                  })}
                  className="border p-2 rounded w-24"
                />
              </div>
            )
          ))}
        </div>
      )}

      <button
        onClick={calculateWeights}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Calculate Weights
      </button>

      {/* Results */}
      {results && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Results</h2>
          <div className="mb-4">
            {results.weights.map(result => {
              const criterion = criteria.find(c => c.id === result.id);
              return (
                <div key={result.id} className="flex items-center gap-4 mb-2">
                  <span className="w-32">{criterion?.name}</span>
                  <span>{(result.weight * 100).toFixed(1)}%</span>
                </div>
              );
            })}
          </div>
          <div className={`p-4 rounded ${
            results.isConsistent ? 'bg-green-100' : 'bg-red-100'
          }`}>
            <p className="font-semibold">
              Consistency Ratio: {results.consistencyRatio.toFixed(3)}
            </p>
            <p className="text-sm mt-1">
              {results.isConsistent 
                ? "The comparisons are consistent (CR ≤ 0.1)"
                : "Warning: The comparisons may be inconsistent (CR > 0.1). Consider revising your comparisons."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
