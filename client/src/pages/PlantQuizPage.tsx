import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, Sun, Droplets, ShieldCheck, Wind, ArrowRight, Check, RotateCcw, Plus } from 'lucide-react';
import api from '../api/client';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/Toast';

interface PlantOption {
  id: number;
  common_name: string;
  scientific_name: string;
  image_url: string;
  water_frequency_days: number;
  sunlight_level: string;
  humidity: string;
  pet_safe: boolean;
  care_tip: string;
}

export const PlantQuizPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [step, setStep] = useState(0);
  const [sunlight, setSunlight] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [careLevel, setCareLevel] = useState<'low' | 'moderate' | 'high'>('low');
  const [petSafeOnly, setPetSafeOnly] = useState(false);
  const [humidity, setHumidity] = useState<'Low' | 'Average' | 'High'>('Average');

  const [library, setLibrary] = useState<PlantOption[]>([]);
  const [recommendations, setRecommendations] = useState<PlantOption[]>([]);
  const [isAdding, setIsAdding] = useState<number | null>(null);

  useEffect(() => {
    api
      .get('/plant-library')
      .then((res) => {
        if (res.data?.data) {
          setLibrary(res.data.data);
        }
      })
      .catch(() => {});
  }, []);

  const handleFinish = () => {
    // Filter matching plants from library
    let filtered = library.filter((p) => {
      if (petSafeOnly && !p.pet_safe) return false;
      return true;
    });

    if (filtered.length === 0) {
      filtered = library;
    }

    // Rank by sunlight alignment
    filtered.sort((a, b) => {
      const aMatch = a.sunlight_level.toLowerCase() === sunlight.toLowerCase() ? 1 : 0;
      const bMatch = b.sunlight_level.toLowerCase() === sunlight.toLowerCase() ? 1 : 0;
      return bMatch - aMatch;
    });

    setRecommendations(filtered.slice(0, 3));
    setStep(4); // results step
  };

  const handleAddPlant = async (plant: PlantOption) => {
    try {
      setIsAdding(plant.id);
      await api.post('/plants', {
        nickname: plant.common_name,
        species: plant.scientific_name,
        water_frequency_days: plant.water_frequency_days,
        sunlight_level: plant.sunlight_level === 'High' ? 'High' : plant.sunlight_level === 'Low' ? 'Low' : 'Medium',
        fertilizing_frequency_days: 14,
        image_url: plant.image_url,
      });
      showToast(`${plant.common_name} added to your collection!`);
      navigate('/plants');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to add plant', 'error');
    } finally {
      setIsAdding(null);
    }
  };

  return (
    <div className="space-y-8 animate-in max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2 pb-4">
        <span className="text-xs font-bold uppercase tracking-widest text-[#3E7B52]">
          Botanical Matchmaker
        </span>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#1F3D2B]">
          Find Your Ideal Plant Companion
        </h1>
        <p className="text-xs sm:text-sm text-[#736159] max-w-lg mx-auto">
          Answer 4 quick questions about your home environment, sunlight, and habits to receive curated plant suggestions.
        </p>
      </div>

      {/* Progress tracker */}
      {step < 4 && (
        <div className="flex items-center justify-center gap-2">
          {[0, 1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                s <= step ? 'w-10 bg-[#1F3D2B]' : 'w-4 bg-[#C9D8C5]'
              }`}
            />
          ))}
        </div>
      )}

      {/* Step 0: Sunlight */}
      {step === 0 && (
        <div className="card p-6 sm:p-8 bg-white border border-[#C9D8C5] shadow-soft space-y-6">
          <div className="space-y-1">
            <h3 className="font-serif font-bold text-xl text-[#1F3D2B]">
              1. What kind of natural light does your space get?
            </h3>
            <p className="text-xs text-[#736159]">
              Look at the nearest window in the room where you plan to place plants.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                id: 'Low',
                title: 'Soft / North Light',
                desc: 'Gentle, indirect shade. No harsh direct sunbeams.',
              },
              {
                id: 'Medium',
                title: 'Moderate / East Light',
                desc: 'Bright morning rays followed by calm indirect brightness.',
              },
              {
                id: 'High',
                title: 'Bright / South or West',
                desc: 'Intense sunbeams for several hours each afternoon.',
              },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSunlight(opt.id as any)}
                className={`p-5 rounded-2xl border text-left transition-all ${
                  sunlight === opt.id
                    ? 'border-[#1F3D2B] bg-[#E4EDB8]/30 shadow-xs'
                    : 'border-[#C9D8C5] bg-[#F5F1E6]/40 hover:bg-[#F5F1E6]'
                }`}
              >
                <Sun className={`w-5 h-5 mb-2 ${sunlight === opt.id ? 'text-[#1F3D2B]' : 'text-[#736159]'}`} />
                <h4 className="font-serif font-bold text-sm text-[#1F3D2B]">{opt.title}</h4>
                <p className="text-xs text-[#736159] mt-1 leading-relaxed">{opt.desc}</p>
              </button>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <Button
              variant="primary"
              onClick={() => setStep(1)}
              icon={<ArrowRight className="w-4 h-4" />}
              iconPosition="right"
            >
              Next Question
            </Button>
          </div>
        </div>
      )}

      {/* Step 1: Care Commitment */}
      {step === 1 && (
        <div className="card p-6 sm:p-8 bg-white border border-[#C9D8C5] shadow-soft space-y-6">
          <div className="space-y-1">
            <h3 className="font-serif font-bold text-xl text-[#1F3D2B]">
              2. How frequently do you want to tend to your plants?
            </h3>
            <p className="text-xs text-[#736159]">
              Be honest with your schedule and travel commitments.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                id: 'low',
                title: 'Set and Forget',
                desc: 'Water once every 2 weeks. Can survive occasional forgetfulness.',
              },
              {
                id: 'moderate',
                title: 'Weekly Routine',
                desc: 'Happy to check and water plants once a week on the weekend.',
              },
              {
                id: 'high',
                title: 'Attentive Caretaker',
                desc: 'Love misting, checking soil daily, and daily foliage monitoring.',
              },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setCareLevel(opt.id as any)}
                className={`p-5 rounded-2xl border text-left transition-all ${
                  careLevel === opt.id
                    ? 'border-[#1F3D2B] bg-[#E4EDB8]/30 shadow-xs'
                    : 'border-[#C9D8C5] bg-[#F5F1E6]/40 hover:bg-[#F5F1E6]'
                }`}
              >
                <Droplets className={`w-5 h-5 mb-2 ${careLevel === opt.id ? 'text-[#1F3D2B]' : 'text-[#736159]'}`} />
                <h4 className="font-serif font-bold text-sm text-[#1F3D2B]">{opt.title}</h4>
                <p className="text-xs text-[#736159] mt-1 leading-relaxed">{opt.desc}</p>
              </button>
            ))}
          </div>

          <div className="flex justify-between pt-2">
            <Button variant="quiet" onClick={() => setStep(0)}>
              Back
            </Button>
            <Button
              variant="primary"
              onClick={() => setStep(2)}
              icon={<ArrowRight className="w-4 h-4" />}
              iconPosition="right"
            >
              Next Question
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Pet Safety */}
      {step === 2 && (
        <div className="card p-6 sm:p-8 bg-white border border-[#C9D8C5] shadow-soft space-y-6">
          <div className="space-y-1">
            <h3 className="font-serif font-bold text-xl text-[#1F3D2B]">
              3. Do you share your home with cats or dogs?
            </h3>
            <p className="text-xs text-[#736159]">
              Some indoor varieties contain calcium oxalate crystals that irritate pets if chewed.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setPetSafeOnly(true)}
              className={`p-6 rounded-2xl border text-left transition-all ${
                petSafeOnly
                  ? 'border-[#1F3D2B] bg-[#E4EDB8]/30 shadow-xs'
                  : 'border-[#C9D8C5] bg-[#F5F1E6]/40 hover:bg-[#F5F1E6]'
              }`}
            >
              <ShieldCheck className="w-6 h-6 mb-2 text-[#3E7B52]" />
              <h4 className="font-serif font-bold text-base text-[#1F3D2B]">
                Yes, strict pet-safe only
              </h4>
              <p className="text-xs text-[#736159] mt-1">
                Only recommend non-toxic species safe around curious nibblers.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setPetSafeOnly(false)}
              className={`p-6 rounded-2xl border text-left transition-all ${
                !petSafeOnly
                  ? 'border-[#1F3D2B] bg-[#E4EDB8]/30 shadow-xs'
                  : 'border-[#C9D8C5] bg-[#F5F1E6]/40 hover:bg-[#F5F1E6]'
              }`}
            >
              <Check className="w-6 h-6 mb-2 text-[#736159]" />
              <h4 className="font-serif font-bold text-base text-[#1F3D2B]">
                No pets or high shelves
              </h4>
              <p className="text-xs text-[#736159] mt-1">
                Show all varieties, including classic tropical favourites like Monsteras.
              </p>
            </button>
          </div>

          <div className="flex justify-between pt-2">
            <Button variant="quiet" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button
              variant="primary"
              onClick={() => setStep(3)}
              icon={<ArrowRight className="w-4 h-4" />}
              iconPosition="right"
            >
              Next Question
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Room Humidity */}
      {step === 3 && (
        <div className="card p-6 sm:p-8 bg-white border border-[#C9D8C5] shadow-soft space-y-6">
          <div className="space-y-1">
            <h3 className="font-serif font-bold text-xl text-[#1F3D2B]">
              4. How humid is the target room?
            </h3>
            <p className="text-xs text-[#736159]">
              Air conditioners and heaters dry indoor air, while bathrooms stay naturally moist.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                id: 'Low',
                title: 'Dry Air',
                desc: 'Near heating vents or continuous air conditioning.',
              },
              {
                id: 'Average',
                title: 'Average Living Space',
                desc: 'Standard living room or bedroom conditions.',
              },
              {
                id: 'High',
                title: 'Moist / Bathroom',
                desc: 'Naturally humid kitchen or bathroom setting.',
              },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setHumidity(opt.id as any)}
                className={`p-5 rounded-2xl border text-left transition-all ${
                  humidity === opt.id
                    ? 'border-[#1F3D2B] bg-[#E4EDB8]/30 shadow-xs'
                    : 'border-[#C9D8C5] bg-[#F5F1E6]/40 hover:bg-[#F5F1E6]'
                }`}
              >
                <Wind className={`w-5 h-5 mb-2 ${humidity === opt.id ? 'text-[#1F3D2B]' : 'text-[#736159]'}`} />
                <h4 className="font-serif font-bold text-sm text-[#1F3D2B]">{opt.title}</h4>
                <p className="text-xs text-[#736159] mt-1 leading-relaxed">{opt.desc}</p>
              </button>
            ))}
          </div>

          <div className="flex justify-between pt-2">
            <Button variant="quiet" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button
              variant="accent"
              onClick={handleFinish}
              icon={<Sparkles className="w-4 h-4" />}
              iconPosition="right"
            >
              See My Matches
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Results */}
      {step === 4 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-2xl text-[#1F3D2B]">
              Top Recommendations For Your Home
            </h3>
            <Button
              variant="quiet"
              size="sm"
              onClick={() => setStep(0)}
              icon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Retake Quiz
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recommendations.map((plant) => (
              <div
                key={plant.id}
                className="bg-white rounded-2xl border border-[#C9D8C5] overflow-hidden shadow-soft flex flex-col justify-between"
              >
                <div>
                  <div className="h-44 overflow-hidden bg-[#ECE5D4]">
                    <img
                      src={plant.image_url}
                      alt={plant.common_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-5 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#E4EDB8] text-[#1F3D2B]">
                        {plant.sunlight_level} Light
                      </span>
                      {plant.pet_safe ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E4EDB8] text-[#1F3D2B]">
                          Pet Safe
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#736159] px-2 py-0.5 rounded-full bg-[#F5F1E6]">
                          Toxic to pets
                        </span>
                      )}
                    </div>

                    <h4 className="font-serif font-bold text-lg text-[#1F3D2B]">
                      {plant.common_name}
                    </h4>
                    <p className="text-xs text-[#736159] italic -mt-1">
                      {plant.scientific_name}
                    </p>
                    <p className="text-xs text-[#736159] leading-relaxed pt-1">
                      {plant.care_tip}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <Button
                    variant="primary"
                    className="w-full"
                    size="sm"
                    isLoading={isAdding === plant.id}
                    onClick={() => handleAddPlant(plant)}
                    icon={<Plus className="w-4 h-4" />}
                  >
                    Add to Collection
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
