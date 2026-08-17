const fs = require('fs');
let code = fs.readFileSync('src/components/TileCalculatorDrawer.tsx', 'utf8');

code = code.replace(
  `    let boxes = 0;
    if (coverage > 0) {
      boxes = Math.ceil(areaWithWastage / coverage);
    }

    const totalCost = boxes * price;

    setResults({
      area,
      areaWithWastage,
      boxes,
      totalCost
    });`,
  `    let exactBoxes = 0;
    let suggestedBoxes = 0;
    
    if (coverage > 0) {
      exactBoxes = areaWithWastage / coverage;
      suggestedBoxes = Math.ceil(exactBoxes);
    }

    const totalCost = suggestedBoxes * price;

    setResults({
      area,
      areaWithWastage,
      boxes: suggestedBoxes,
      exactBoxes,
      totalCost
    });`
);

code = code.replace(
  `  const [results, setResults] = useState({
    area: 0,
    areaWithWastage: 0,
    boxes: 0,
    totalCost: 0
  });`,
  `  const [results, setResults] = useState({
    area: 0,
    areaWithWastage: 0,
    boxes: 0,
    exactBoxes: 0,
    totalCost: 0
  });`
);

const htmlReplaceTarget = `<div className="bg-blue-600 rounded-2xl p-4 text-white shadow-lg shadow-blue-600/20 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="text-blue-100 text-sm font-medium">Boxes Required</div>
                  <div className="text-2xl font-black">{results.boxes} <span className="text-sm font-medium text-blue-200">Boxes</span></div>
                </div>`;

const newHtml = `<div className="bg-blue-600 rounded-2xl p-4 text-white shadow-lg shadow-blue-600/20 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="text-blue-100 text-sm font-medium">Exact Calculation</div>
                  <div className="text-xl font-bold text-blue-50">{results.exactBoxes.toFixed(2)} <span className="text-sm font-medium text-blue-200">Boxes</span></div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-white text-base font-bold">Suggested to Buy</div>
                  <div className="text-3xl font-black">{results.boxes} <span className="text-sm font-medium text-blue-200">Boxes</span></div>
                </div>`;

code = code.replace(htmlReplaceTarget, newHtml);

fs.writeFileSync('src/components/TileCalculatorDrawer.tsx', code);
