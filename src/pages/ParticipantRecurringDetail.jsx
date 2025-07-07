import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import ReactECharts from 'echarts-for-react';

const { FiArrowLeft, FiSave, FiMessageSquare, FiX, FiCheck, FiCalendar } = FiIcons;

const ParticipantRecurringDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { recurringAgreements, recurringReports, setRecurringReports, notes, setNotes } = useData();

  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [newNote, setNewNote] = useState('');
  const [showNoteForm, setShowNoteForm] = useState(false);

  const recurring = recurringAgreements.find(r => r.id === id);
  const recurringNotes = notes.filter(n => n.recurringId === id && n.userId === user.id && !n.isCoachNote).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  if (!recurring) {
    return <div>Herhalingsafspraak niet gevonden</div>;
  }

  const isResultMethod = recurring.afspraakmethode === 'resultaat';

  const getDaysInMonth = (yearMonth) => {
    const [year, month] = yearMonth.split('-').map(Number);
    return new Date(year, month, 0).getDate();
  };

  const getFirstDayOfMonth = (yearMonth) => {
    const [year, month] = yearMonth.split('-').map(Number);
    const firstDay = new Date(year, month - 1, 1).getDay();
    // Convert Sunday (0) to 7, and adjust so Monday = 0
    return firstDay === 0 ? 6 : firstDay - 1;
  };

  const getMonthReport = () => {
    return recurringReports.find(r => r.recurringId === id && r.month === selectedMonth);
  };

  const toggleDay = (day) => {
    if (isResultMethod) return; // Don't allow toggling for result method
    
    const monthReport = getMonthReport();
    
    if (monthReport) {
      const updatedDays = monthReport.completedDays.includes(day)
        ? monthReport.completedDays.filter(d => d !== day)
        : [...monthReport.completedDays, day];
      
      setRecurringReports(recurringReports.map(r => 
        r.id === monthReport.id 
          ? { ...r, completedDays: updatedDays }
          : r
      ));
    } else {
      const newReport = {
        id: Date.now().toString(),
        recurringId: id,
        participantId: user.id,
        month: selectedMonth,
        completedDays: [day],
        values: isResultMethod ? {} : undefined
      };
      setRecurringReports([...recurringReports, newReport]);
    }
  };

  const updateDayValue = (day, value) => {
    if (!isResultMethod) return;
    
    const monthReport = getMonthReport();
    const numValue = parseFloat(value) || 0;
    
    if (monthReport) {
      const updatedValues = { ...monthReport.values, [day]: numValue };
      setRecurringReports(recurringReports.map(r => 
        r.id === monthReport.id 
          ? { ...r, values: updatedValues }
          : r
      ));
    } else {
      const newReport = {
        id: Date.now().toString(),
        recurringId: id,
        participantId: user.id,
        month: selectedMonth,
        completedDays: [],
        values: { [day]: numValue }
      };
      setRecurringReports([...recurringReports, newReport]);
    }
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;

    const note = {
      id: Date.now().toString(),
      userId: user.id,
      recurringId: id,
      text: newNote,
      timestamp: new Date().toISOString(),
      isCoachNote: false
    };

    setNotes([...notes, note]);
    setNewNote('');
    setShowNoteForm(false);
  };

  const getChartData = () => {
    if (!isResultMethod) return null;

    const daysInMonth = getDaysInMonth(selectedMonth);
    const monthReport = getMonthReport();
    const values = monthReport?.values || {};

    const data = [];
    const categories = [];

    // Collect all non-zero values with their days
    const dataPoints = [];
    for (let day = 1; day <= daysInMonth; day++) {
      categories.push(day.toString());
      if (values[day] && values[day] > 0) {
        dataPoints.push({ day, value: values[day] });
      }
    }

    // If we have data points, create interpolated line
    if (dataPoints.length > 0) {
      for (let day = 1; day <= daysInMonth; day++) {
        const exactValue = values[day];
        if (exactValue && exactValue > 0) {
          data.push(exactValue);
        } else {
          // Find the nearest values for interpolation
          const before = dataPoints.filter(dp => dp.day < day).pop();
          const after = dataPoints.find(dp => dp.day > day);
          
          if (before && after) {
            // Linear interpolation
            const ratio = (day - before.day) / (after.day - before.day);
            const interpolated = before.value + ratio * (after.value - before.value);
            data.push(interpolated);
          } else if (before) {
            // Extend the last value
            data.push(before.value);
          } else if (after) {
            // Extend the first value
            data.push(after.value);
          } else {
            data.push(0);
          }
        }
      }
    } else {
      // No data points, fill with zeros
      for (let day = 1; day <= daysInMonth; day++) {
        data.push(0);
      }
    }

    return {
      tooltip: {
        trigger: 'axis',
        formatter: function(params) {
          const day = params[0].axisValue;
          const value = values[day];
          if (value && value > 0) {
            return `Dag ${day}: ${value} (werkelijk)`;
          } else {
            return `Dag ${day}: ${params[0].value.toFixed(1)} (geïnterpoleerd)`;
          }
        }
      },
      xAxis: {
        type: 'category',
        data: categories,
        name: 'Dag'
      },
      yAxis: {
        type: 'value',
        name: 'Waarde'
      },
      series: [
        {
          data: data,
          type: 'line',
          smooth: true,
          connectNulls: true,
          itemStyle: {
            color: '#3B82F6'
          },
          lineStyle: {
            width: 2
          }
        }
      ]
    };
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(selectedMonth);
    const firstDayOfMonth = getFirstDayOfMonth(selectedMonth);
    const monthReport = getMonthReport();
    const completedDays = monthReport ? monthReport.completedDays : [];
    const values = isResultMethod ? (monthReport?.values || {}) : {};
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="w-16 h-16"></div>);
    }
    
    // Add the actual days
    for (let day = 1; day <= daysInMonth; day++) {
      const isCompleted = completedDays.includes(day);
      const dayValue = values[day] || '';
      
      if (isResultMethod) {
        days.push(
          <div key={day} className="w-16 h-16 border-2 border-gray-300 rounded-lg p-1 flex flex-col items-center justify-center bg-white">
            <span className="text-xs font-medium text-gray-600">{day}</span>
            <input
              type="number"
              step="0.1"
              value={dayValue}
              onChange={(e) => updateDayValue(day, e.target.value)}
              className="w-full text-xs text-center border-0 p-0 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
              placeholder="0"
            />
          </div>
        );
      } else {
        days.push(
          <button
            key={day}
            onClick={() => toggleDay(day)}
            className={`w-12 h-12 rounded-lg border-2 transition-all flex items-center justify-center ${
              isCompleted
                ? 'bg-green-500 border-green-500 text-white'
                : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
            }`}
          >
            <span className="text-sm font-medium">{day}</span>
            {isCompleted && (
              <SafeIcon icon={FiCheck} className="text-xs ml-1" />
            )}
          </button>
        );
      }
    }

    const gridCols = isResultMethod ? 'grid-cols-7' : 'grid-cols-7';
    
    return (
      <div className={`grid ${gridCols} gap-2`}>
        {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map(day => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
        {days}
      </div>
    );
  };

  const currentMonth = new Date().toISOString().slice(0, 7);
  const previousMonth = new Date();
  previousMonth.setMonth(previousMonth.getMonth() - 1);
  const prevMonthStr = previousMonth.toISOString().slice(0, 7);

  const currentMonthReport = recurringReports.find(r => r.recurringId === id && r.month === currentMonth);
  const previousMonthReport = recurringReports.find(r => r.recurringId === id && r.month === prevMonthStr);

  const getCurrentStats = () => {
    if (isResultMethod) {
      const values = currentMonthReport?.values || {};
      const total = Object.values(values).reduce((sum, val) => sum + val, 0);
      const count = Object.values(values).length;
      const average = count > 0 ? (total / count).toFixed(1) : '0.0';
      return `${total.toFixed(1)} totaal (⌀ ${average})`;
    } else {
      return `${currentMonthReport ? currentMonthReport.completedDays.length : 0} dagen`;
    }
  };

  const getPreviousStats = () => {
    if (isResultMethod) {
      const values = previousMonthReport?.values || {};
      const total = Object.values(values).reduce((sum, val) => sum + val, 0);
      const count = Object.values(values).length;
      const average = count > 0 ? (total / count).toFixed(1) : '0.0';
      return `${total.toFixed(1)} totaal (⌀ ${average})`;
    } else {
      return `${previousMonthReport ? previousMonthReport.completedDays.length : 0} dagen`;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mr-6"
            >
              <SafeIcon icon={FiArrowLeft} />
              Terug naar dashboard
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{recurring.rubriek}</h1>
              <p className="text-sm text-gray-600">{recurring.afspraakdoel}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Afspraak details */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Afspraak details</h2>
              
              <div className="space-y-3">
                <div>
                  <span className="font-medium text-gray-700">Actie:</span>
                  <p className="text-gray-600">{recurring.afspraakactie}</p>
                </div>
                
                <div>
                  <span className="font-medium text-gray-700">Notitie:</span>
                  <p className="text-gray-600">{recurring.afspraaknotitie}</p>
                </div>
                
                <div>
                  <span className="font-medium text-gray-700">Frequentie:</span>
                  <p className="text-gray-600">{recurring.afspraakfrequentie}</p>
                </div>

                <div>
                  <span className="font-medium text-gray-700">Methode:</span>
                  <p className="text-gray-600">
                    {isResultMethod ? 'Resultaat (getallen)' : 'Nee/Ja (dagen aanklikken)'}
                  </p>
                </div>

                {/* Consequentie weergave voor deelnemer */}
                {recurring.consequentie && recurring.consequentieVanToepassing === 'ja' && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <span className="font-medium text-gray-700">Consequentie:</span>
                    <p className="text-gray-800 mt-1">{recurring.consequentie}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Statistieken</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Deze maand</span>
                  <span className="text-lg font-bold text-blue-600">
                    {getCurrentStats()}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Vorige maand</span>
                  <span className="text-lg font-bold text-gray-600">
                    {getPreviousStats()}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Notities</h3>
                <button
                  onClick={() => setShowNoteForm(true)}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  <SafeIcon icon={FiMessageSquare} className="inline mr-1" />
                  Toevoegen
                </button>
              </div>
              
              {recurringNotes.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {recurringNotes.map(note => (
                    <div key={note.id} className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-800">{note.text}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(note.timestamp).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Nog geen notities toegevoegd</p>
              )}
            </div>
          </div>

          {/* Kalender en grafiek */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <SafeIcon icon={FiCalendar} />
                  Voortgang bijhouden
                </h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Maand selecteren
                  </label>
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  {isResultMethod 
                    ? 'Voer een getal in voor elke dag waarop je de afspraakactie hebt uitgevoerd.'
                    : 'Klik op een dag om aan te geven dat je de afspraakactie hebt uitgevoerd.'
                  }
                </p>
              </div>

              {renderCalendar()}

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">
                  {new Date(selectedMonth + '-01').toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })}
                </h4>
                <p className="text-sm text-gray-600">
                  {isResultMethod ? (
                    <>
                      Totaal resultaat:{' '}
                      <span className="font-medium text-blue-600">
                        {Object.values(getMonthReport()?.values || {}).reduce((sum, val) => sum + val, 0).toFixed(1)}
                      </span>
                    </>
                  ) : (
                    <>
                      Uitgevoerd op{' '}
                      <span className="font-medium text-green-600">
                        {getMonthReport()?.completedDays.length || 0} dagen
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Grafiek voor resultaat methode */}
            {isResultMethod && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Verloop resultaten (geïnterpoleerd)</h3>
                <div className="h-64">
                  <ReactECharts 
                    option={getChartData()} 
                    style={{ height: '100%', width: '100%' }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  * Lijn wordt geïnterpoleerd tussen werkelijke metingen. Werkelijke waarden worden getoond bij hoveren.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Note Form Modal */}
      {showNoteForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Notitie toevoegen</h3>
              <button
                onClick={() => setShowNoteForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <SafeIcon icon={FiX} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notitie
                </label>
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="4"
                  placeholder="Typ je notitie hier..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowNoteForm(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={handleAddNote}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <SafeIcon icon={FiSave} />
                Opslaan
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ParticipantRecurringDetail;