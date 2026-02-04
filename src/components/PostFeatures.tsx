'use client';
import PickMap from '@/components/PickMap';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { geocodeAddress, reverseGeocode } from '@/lib/geocode';
import type { LatLng } from '@/lib/geocode';
import {supabase} from '@/lib/supabaseClient';

const CATS = ['cafe', 'restaurant', 'museum', 'view', 'bar', 'club', 'park', 'other'];
type Cat = (typeof CATS)[number];

export type PostForm = {
    title: string;
    address: string;
    coords: LatLng | null;
    category: string;
    description: string;
};

type EditingPost = {
  id: string;
  title: string;
  description: string | null;
  category_slug: string;
  lat: number;
  lng: number;
};

export default function PostFeatures({ editingPost }: { editingPost?: EditingPost }) {
  const router = useRouter();
  // who is logged in
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Step indicator for form sections
  const [currentStep, setCurrentStep] = useState<'details' | 'location' | 'review'>(editingPost ? 'details' : 'details');

  //post form state
  const [form, setForm] = useState<PostForm>({
        title: '',
        address: '',
        coords: null as LatLng | null,
        category: 'other' as Cat,
        description: ''
  });
  const [msg, setMsg] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  
  // Google Places Autocomplete
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [placesAutocomplete, setPlacesAutocomplete] = useState<unknown | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [predictions, setPredictions] = useState<unknown[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);

  // loads the current user info
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const u = data?.user ?? null;
      setUserEmail(u?.email ?? null);
      setUserId(u?.id ?? null);

      // If editing, populate form with existing data
      if (editingPost) {
        setForm({
          title: editingPost.title,
          description: editingPost.description || '',
          category: editingPost.category_slug as Cat,
          address: '',
          coords: { lat: editingPost.lat, lng: editingPost.lng },
        });
        setMsg(''); // Clear any messages when editing
      }
    })();
  }, [editingPost]);

  // Initialize Google Places Autocomplete
  useEffect(() => {
    const initAutocomplete = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const g = (window as any).google;
      if (!g || !g.maps || !g.maps.places) return;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      const autocomplete = new g.maps.places.AutocompleteService();
      setPlacesAutocomplete(autocomplete);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g = (window as any).google;
    if (g && g.maps && g.maps.places) {
      initAutocomplete();
    } else {
      // Wait for Google Maps to load
      const checkGoogle = setInterval(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const googleMaps = (window as any).google;
        if (googleMaps && googleMaps.maps && googleMaps.maps.places) {
          initAutocomplete();
          clearInterval(checkGoogle);
        }
      }, 500);

      return () => clearInterval(checkGoogle);
    }
  }, []);

  // Handle search input changes and fetch predictions
  const handleSearchChange = async (input: string) => {
    setSearchQuery(input);
    
    if (!input.trim()) {
      setPredictions([]);
      setShowPredictions(false);
      return;
    }

    if (!placesAutocomplete) return;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const g = (window as any).google;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      const sessionToken = new g.maps.places.AutocompleteSessionToken();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (placesAutocomplete as any).getPlacePredictions({
        input,
        sessionToken,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const preds = (result as any).predictions || [];
      setPredictions(preds);
      setShowPredictions(preds.length > 0);
    } catch (err) {
      console.error('Autocomplete error:', err);
      setPredictions([]);
    }
  };

  // Handle selection of a prediction
  const handlePredictionSelect = async (prediction: unknown) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pred = prediction as any;
    const placeName = pred?.structured_formatting?.main_text ?? pred?.main_text ?? pred?.description ?? '';
    setSearchQuery(pred.description);
    setShowPredictions(false);
    
    // Set address and auto-fill title with place name
    setForm((f) => ({ ...f, address: pred.description, title: placeName }));

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const g = (window as any).google;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      const placesService = new g.maps.places.PlacesService(document.createElement('div'));
      
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      placesService.getDetails({
        placeId: pred.place_id,
        fields: ['geometry', 'formatted_address'],
      }, (place: unknown) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const p = place as any;
        if (p && p.geometry && p.geometry.location) {
          const coords: LatLng = {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            lat: p.geometry.location.lat(),
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            lng: p.geometry.location.lng(),
          };
          setForm((f) => ({ ...f, coords, address: p.formatted_address || pred.description }));
          setMsg('Location found! 📍');
          setTimeout(() => setMsg(''), 3000);
        }
      });
    } catch (err) {
      console.error('Place details error:', err);
    }
  };

    //address to geocode to coords and marker
  async function handleGeocode() {
        if (!form.address.trim()) {
            setMsg('Enter an address to geocode.');
            return;
        }
        setMsg('Geocoding...');
        const p = await geocodeAddress(form.address.trim());
        if (!p){
            setMsg('Address not found.');
            return;
        }
        setForm((f) => ({ ...f, coords: p }));
        setMsg(`Found: ${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}`);
    }

    //coords input to update coords and marker
    function handleCoordsChange(which: 'lat' | 'lng', val: string) {
        const n = Number(val);
        setForm((f) => {
          if (Number.isNaN(n)) return { ...f, coords: null };
            const current = f.coords || { lat: 0, lng: 0 };
            const updated : LatLng = which === 'lat' ? { lat: n, lng: current.lng } : { lat: current.lat, lng: n };
            return { ...f, coords: updated};
        });
    }


//reverse geocode to fill address from map/coords
async function handleReverse(){
    if (!form.coords) {
        setMsg('No coordinates to reverse geocode.');
        return;
    }
    setMsg('Looking up address...');
    const name = await reverseGeocode(form.coords);
    if (!name) {
        setMsg('No address found for these coordinates.');
        return;
    }
    setForm((f) => ({ ...f, address: name }));
    setMsg('Address found.');
  }

//map click -> set coords and marker
function handlePick(p: LatLng) {
    setForm((f) => ({ ...f, coords: p }));
}

//create or update post in supabase
async function handleCreatePost(e: React.FormEvent) {
    e.preventDefault();
    setMsg('');
    if (!form.title.trim()) {
        setMsg('Title is required.');
        return;
    } 
    if (!form.coords) {
        setMsg('Pick a location (address, coords or map).');
        return;
    }
    setLoading(true);
    
    try {
      if (editingPost) {
        // Update existing post
        const { error } = await supabase
          .from('posts')
          .update({
            title: form.title.trim(),
            address: form.address.trim() || null,
            lat: form.coords.lat,
            lng: form.coords.lng,
            category_slug: form.category || null,
            description: form.description.trim() || null,
          })
          .eq('id', editingPost.id);
        
        setLoading(false);
        if (error) setMsg(`Failed to update post: ${error.message}`);
        else {
          setMsg('Post updated successfully!');
          setTimeout(() => router.push('/profile'), 1500);
        }
      } else {
        // Create new post
        const { error } = await supabase.from('posts').insert({
          user_id: userId,
          title: form.title.trim(),
          address: form.address.trim() || null,
          lat: form.coords.lat,
          lng: form.coords.lng,
          category_slug: form.category || null,
          description: form.description.trim() || null,
        });
        setLoading(false);
        if (error) setMsg(`Failed to create post: ${error.message}`);
        else {
          setMsg('Post created successfully!');
          setTimeout(() => router.push('/'), 1500);
        }
      }
    } catch (err) {
      setLoading(false);
      setMsg('An error occurred');
      console.error(err);
    }
  }

  // Validation functions for each step
  const validateDetailsStep = () => {
    if (!form.title.trim()) {
      setMsg('Please enter a title');
      return false;
    }
    if (!form.category) {
      setMsg('Please select a category');
      return false;
    }
    setMsg('');
    return true;
  };

  const validateLocationStep = () => {
    if (!form.coords) {
      setMsg('Please pick a location on the map or enter coordinates');
      return false;
    }
    setMsg('');
    return true;
  };

  const handleNextStep = () => {
    setMsg(''); // Clear any previous messages before validating
    if (currentStep === 'details') {
      if (validateDetailsStep()) {
        // When editing, skip location step and go directly to review
        if (editingPost) {
          setCurrentStep('review');
        } else {
          setCurrentStep('location');
        }
      }
    } else if (currentStep === 'location') {
      if (validateLocationStep()) {
        setCurrentStep('review');
      }
    }
  };

  const handlePrevStep = () => {
    setMsg(''); // Clear message when navigating back
    if (currentStep === 'location') {
      setCurrentStep('details');
    } else if (currentStep === 'review') {
      // When editing, go back to details (skip location)
      if (editingPost) {
        setCurrentStep('details');
      } else {
        setCurrentStep('location');
      }
    }
  };

//UI
  return (
  <form onSubmit={handleCreatePost} className="space-y-6 max-w-2xl">
    {/* ✨ STEP 1: Progress/Steps Indicator */}
    {/* Shows the user which section they're currently filling out (Location, Details, or Review) */}
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        {/* Step 1: Location */}
        <div className="flex flex-col items-center flex-1">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white mb-2 transition-all ${
            currentStep === 'details'
              ? 'bg-teal-500'
              : 'bg-gray-300'
          }`}>
            1
          </div>
          <p className={`text-sm font-semibold ${currentStep === 'details' ? 'text-teal-600 dark:text-teal-400' : 'text-gray-600 dark:text-gray-400'}`}>Location</p>
        </div>

        {/* Connector line */}
        <div className={`flex-1 h-1 mx-2 mb-6 transition-all ${currentStep === 'location' || currentStep === 'review' ? 'bg-teal-500' : 'bg-gray-300'}`} />

        {/* Step 2: Details */}
        <div className="flex flex-col items-center flex-1">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white mb-2 transition-all ${
            currentStep === 'location'
              ? 'bg-teal-500'
              : 'bg-gray-300'
          }`}>
            2
          </div>
          <p className={`text-sm font-semibold ${currentStep === 'location' ? 'text-teal-600 dark:text-teal-400' : 'text-gray-600 dark:text-gray-400'}`}>Details</p>
        </div>

        {/* Connector line */}
        <div className={`flex-1 h-1 mx-2 mb-6 transition-all ${currentStep === 'review' ? 'bg-teal-500' : 'bg-gray-300'}`} />

        {/* Step 3: Review */}
        <div className="flex flex-col items-center flex-1">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white mb-2 transition-all ${
            currentStep === 'review'
              ? 'bg-teal-500'
              : 'bg-gray-300'
          }`}>
            3
          </div>
          <p className={`text-sm font-semibold ${currentStep === 'review' ? 'text-teal-600 dark:text-teal-400' : 'text-gray-600 dark:text-gray-400'}`}>Review</p>
        </div>
      </div>
    </div>
    <div className= "flex items-center justify-between border-b-2 border-teal-500 pb-4">
    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{editingPost ? 'Edit Post' : 'Create a Post'}</h2>
    {userEmail 
      ? <span className="text-sm text-gray-600 dark:text-gray-400">Logged in as <span className="text-teal-600 font-semibold">{userEmail.split('@')[0]}</span></span>
      : <span className="text-sm text-gray-600 dark:text-gray-400">Not logged in</span>}
    </div>
    
    {/* 📋 STEP 2: Organize Form into Sections */}
    {/* STEP 1: Location Section - Show First */}
    {currentStep === 'details' && !editingPost && (
      <div className="space-y-5">
        <div className="bg-teal-50 dark:bg-teal-900/20 p-4 rounded-lg border-l-4 border-teal-500 mb-6">
          <h3 className="text-lg font-bold text-teal-900 dark:text-teal-300">📍 Step 1: Pick the location</h3>
          <p className="text-sm text-teal-700 dark:text-teal-400 mt-1">Search for a place by name, click on the map, or enter coordinates</p>
        </div>

        {/* PRIMARY METHOD: Google Places Search */}
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-5 rounded-lg border-2 border-blue-300 dark:border-blue-600">
          <label className="text-sm font-semibold text-gray-900 dark:text-white block mb-3">
            🔍 Search for a place (Primary Method)
          </label>
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              className="w-full border-2 border-blue-300 dark:border-blue-600 rounded-lg p-4 bg-white dark:bg-gray-800 dark:text-white focus:border-blue-500 focus:outline-none transition-colors text-base"
              placeholder="e.g., Eiffel Tower, Big Ben, Statue of Liberty, Times Square..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => searchQuery.trim() && predictions.length > 0 && setShowPredictions(true)}
              autoComplete="off"
            />
            
            {/* Predictions Dropdown */}
            {showPredictions && predictions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border-2 border-blue-300 dark:border-blue-600 rounded-lg shadow-2xl z-50 max-h-64 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(predictions as any[]).map((pred: any, idx: number) => {
                  const main = pred?.structured_formatting?.main_text ?? pred?.main_text ?? pred?.description ?? 'Unknown place';
                  const secondary = pred?.structured_formatting?.secondary_text ?? pred?.secondary_text ?? '';
                  return (
                    <button
                      key={idx}
                      onClick={() => handlePredictionSelect(pred)}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/40 transition-colors cursor-pointer flex items-start gap-3"
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-teal-500 flex-shrink-0 mt-1" aria-hidden="true" />
                      <div className="flex-1 overflow-hidden">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm leading-5 truncate">{main}</p>
                        {secondary && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{secondary}</p>}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <p className="text-xs text-blue-700 dark:text-blue-400 mt-2">📌 Type any place name and select from suggestions</p>
        </div>

        {/* SECONDARY METHOD: Interactive Map */}
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">🗺️ Or click on the map to pinpoint</p>
          <div className="rounded-lg overflow-hidden border-2 border-teal-500 shadow-lg hover:shadow-teal-500/20 transition-shadow">
            <PickMap value={form.coords} onPick={handlePick} />
          </div>
          <p className="text-xs text-teal-700 dark:text-teal-400 mt-2">Click anywhere on the map to set the location</p>
        </div>

        {/* Live Preview */}
        {form.coords && (
          <div className="p-5 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-lg border-2 border-teal-300 dark:border-teal-600 shadow-md">
            <p className="text-sm font-bold text-teal-700 dark:text-teal-300 mb-3">👁️ Location Preview</p>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-2">
              <h4 className="font-bold text-gray-900 dark:text-white text-lg">{form.title || '(Will be filled from location)'}</h4>
              <p className="inline-block px-2 py-1 bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 rounded text-xs font-semibold">
                {form.category ? form.category.charAt(0).toUpperCase() + form.category.slice(1) : 'Category'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{form.description || '(Your description will appear here)'}</p>
              <div className="bg-gray-100 dark:bg-gray-700 rounded p-3 mt-3 border-l-4 border-teal-500 space-y-1">
                <p className="text-xs text-gray-700 dark:text-gray-300 font-mono">📍 {form.coords.lat.toFixed(6)}, {form.coords.lng.toFixed(6)}</p>
                {form.address && <p className="text-xs text-gray-700 dark:text-gray-300">{form.address}</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    )}

    {/* STEP 2: Details Section - Title, Category, Description (Show Second) */}
    {currentStep === 'location' && !editingPost && (
      <div className="space-y-5">
        <div className="bg-teal-50 dark:bg-teal-900/20 p-4 rounded-lg border-l-4 border-teal-500 mb-6">
          <h3 className="text-lg font-bold text-teal-900 dark:text-teal-300">📝 Step 2: Tell us about the place</h3>
          <p className="text-sm text-teal-700 dark:text-teal-400 mt-1">Give your recommendation a title and choose a category</p>
        </div>
        <div className="grid gap-5">
          {/* Title Input with Character Counter */}
          <label className="text-sm font-semibold text-gray-900 dark:text-white">
            <div className="flex items-center justify-between mb-2">
              <span><span className="text-coral">*</span> Title</span>
              <span className={`text-xs font-medium ${form.title.length >= 55 ? 'text-orange-500' : form.title.length >= 60 ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
                {form.title.length}/60
              </span>
            </div>
            <input
              className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-gray-800 dark:text-white focus:border-teal-500 focus:outline-none transition-colors"
              value={form.title}
              onChange={(e) => {
                const val = e.target.value.slice(0, 60);
                setForm((f) => ({ ...f, title: val }));
              }}
              placeholder="e.g., Amazing Sunset Café"
              maxLength={60}
              required
            />
            {/* Character Progress Bar */}
            <div className="mt-2 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${
                  form.title.length >= 60 ? 'bg-red-500' : 
                  form.title.length >= 55 ? 'bg-orange-500' : 
                  'bg-teal-500'
                }`}
                style={{ width: `${Math.min((form.title.length / 60) * 100, 100)}%` }}
              />
            </div>
          </label>

          {/* Category Select */}
          <label className="text-sm font-semibold text-gray-900 dark:text-white">
            <span className="text-coral">*</span> Category
            <select
              className="mt-2 w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-gray-800 dark:text-white focus:border-teal-500 focus:outline-none transition-colors"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as Cat}))}
            >
              {CATS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          </label>

          {/* Description Textarea with Character Counter */}
          <label className="text-sm font-semibold text-gray-900 dark:text-white">   
            <div className="flex items-center justify-between mb-2">
              <span>Description</span>
              <span className={`text-xs font-medium ${form.description.length >= 450 ? 'text-orange-500' : form.description.length >= 500 ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
                {form.description.length}/500
              </span>
            </div>
            <textarea
              className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-gray-800 dark:text-white focus:border-teal-500 focus:outline-none transition-colors"
              value={form.description}
              onChange={(e) => {
                const val = e.target.value.slice(0, 500);
                setForm((f) => ({ ...f, description: val }));
              }}
              placeholder="Tell others what makes this place special..."
              rows={4}
              maxLength={500}
            />
            {/* Character Progress Bar */}
            <div className="mt-2 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${
                  form.description.length >= 500 ? 'bg-red-500' : 
                  form.description.length >= 450 ? 'bg-orange-500' : 
                  'bg-teal-500'
                }`}
                style={{ width: `${Math.min((form.description.length / 500) * 100, 100)}%` }}
              />
            </div>
          </label>

          {/* Location Info - Read Only when editing */}
          {editingPost && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-300 dark:border-blue-700">
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">📍 Location (Cannot be changed)</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-blue-700 dark:text-blue-400 mb-1">Latitude</p>
                  <p className="text-sm font-mono text-blue-900 dark:text-blue-200">{form.coords?.lat.toFixed(6)}</p>
                </div>
                <div>
                  <p className="text-xs text-blue-700 dark:text-blue-400 mb-1">Longitude</p>
                  <p className="text-sm font-mono text-blue-900 dark:text-blue-200">{form.coords?.lng.toFixed(6)}</p>
                </div>
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-400 mt-2">To change the location, please create a new post instead.</p>
            </div>
          )}
        </div>
      </div>
    )}

    {/* STEP 3: Review Section - Preview before submission */}
    {currentStep === 'review' && (
      <div className="space-y-5">
        <div className="bg-teal-50 dark:bg-teal-900/20 p-4 rounded-lg border-l-4 border-teal-500 mb-6">
          <h3 className="text-lg font-bold text-teal-900 dark:text-teal-300">✅ Step 3: Review your post</h3>
          <p className="text-sm text-teal-700 dark:text-teal-400 mt-1">Make sure everything looks good before publishing</p>
        </div>

        {/* Preview Card */}
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border-2 border-teal-300 dark:border-teal-600 shadow-lg">
          <h4 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">{form.title || '(No title added)'}</h4>
          <p className="inline-block px-3 py-1 bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 rounded-full text-sm font-semibold mb-4">
            {form.category ? form.category.charAt(0).toUpperCase() + form.category.slice(1) : 'No category'}
          </p>
          <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed whitespace-pre-wrap">{form.description || '(No description added)'}</p>
          <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-400"><strong>📍 Coordinates:</strong> {form.coords ? `${form.coords.lat.toFixed(6)}, ${form.coords.lng.toFixed(6)}` : 'Not set'}</p>
            {form.address && <p className="text-sm text-gray-600 dark:text-gray-400"><strong>🏠 Address:</strong> {form.address}</p>}
          </div>
        </div>
      </div>
    )}

    {/* Submission Button and Message */}
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-4 border-t-2 border-teal-500">
      {currentStep !== 'details' && (
        <button
          type="button"
          onClick={handlePrevStep}
          className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-lg transition-all"
        >
          ← Previous
        </button>
      )}
      
      {currentStep !== 'review' && (
        <button
          type="button"
          onClick={handleNextStep}
          className="px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-lg transition-all"
        >
          Next →
        </button>
      )}
      
      {currentStep === 'review' && (
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-teal-500/50 transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? '✓ Saving…' : editingPost ? '✏️ Update Post' : '📍 Create Post'}
        </button>
      )}
      {msg && <span className="text-sm font-semibold text-red-600 dark:text-red-400">{msg}</span>}
    </div>
  </form>
  );
}

        
