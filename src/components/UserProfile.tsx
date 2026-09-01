import { useState, useEffect, useRef } from 'react';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { User, Camera, Save, Loader2, Linkedin, CheckCircle2, X, AlertCircle, Users, Send, Briefcase, Plus, Trash2, Calendar, Building } from 'lucide-react';

interface JourneyItem {
  id: string;
  type: 'internship' | 'project';
  title: string;
  organization: string;
  startDate: string;
  endDate: string;
  description: string;
}

interface Endorsement {
  mentorUid: string;
  mentorName: string;
}

interface Skill {
  name: string;
  endorsements: Endorsement[];
}

export function UserProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [displayName, setDisplayName] = useState('');
  const [linkedIn, setLinkedIn] = useState('');
  const [linkedInStatus, setLinkedInStatus] = useState<'idle' | 'checking' | 'verified' | 'invalid'>('idle');
  const [photoURL, setPhotoURL] = useState('');
  
  const [skills, setSkills] = useState<Skill[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [userRole, setUserRole] = useState('student');
  
  const [journey, setJourney] = useState<JourneyItem[]>([]);
  const [showAddJourney, setShowAddJourney] = useState(false);
  const [newJourney, setNewJourney] = useState<Partial<JourneyItem>>({ type: 'internship' });
  
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const [showMentorshipModal, setShowMentorshipModal] = useState(false);
  const [mentors, setMentors] = useState<{uid: string, displayName: string, email: string}[]>([]);
  const [selectedMentor, setSelectedMentor] = useState('');
  const [mentorshipMessage, setMentorshipMessage] = useState('');
  const [requestingMentorship, setRequestingMentorship] = useState(false);
  const [mentorshipSuccess, setMentorshipSuccess] = useState(false);

  const fetchMentors = async () => {
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'mentor'));
      const snapshot = await getDocs(q);
      const mentorsList = snapshot.docs.map(doc => ({
        uid: doc.id,
        displayName: doc.data().displayName || 'Anonymous Mentor',
        email: doc.data().email
      }));
      setMentors(mentorsList);
    } catch (err) {
      console.error("Error fetching mentors:", err);
    }
  };

  const openMentorshipModal = () => {
    setShowMentorshipModal(true);
    fetchMentors();
  };

  const handleRequestMentorship = async () => {
    if (!selectedMentor || !auth.currentUser) return;
    
    setRequestingMentorship(true);
    try {
      const mentor = mentors.find(m => m.uid === selectedMentor);
      
      await addDoc(collection(db, 'mentorshipRequests'), {
        studentId: auth.currentUser.uid,
        studentName: displayName || auth.currentUser.displayName || 'Student',
        mentorId: selectedMentor,
        mentorName: mentor?.displayName || 'Mentor',
        status: 'pending',
        message: mentorshipMessage,
        createdAt: new Date().toISOString()
      });
      
      setMentorshipSuccess(true);
      setTimeout(() => {
        setShowMentorshipModal(false);
        setMentorshipSuccess(false);
        setSelectedMentor('');
        setMentorshipMessage('');
      }, 2000);
    } catch (err) {
      console.error("Error requesting mentorship:", err);
      alert("Failed to send request.");
    } finally {
      setRequestingMentorship(false);
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setDisplayName(data.displayName || currentUser.displayName || '');
          setLinkedIn(data.linkedIn || '');
          setPhotoURL(data.photoURL || currentUser.photoURL || '');
          setSkills(data.skills || []);
          setJourney(data.journey || []);
          setUserRole(data.role || 'student');
        }
      } catch (err) {
        console.error("Error fetching user profile:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, []);

  const addSkill = () => {
    if (newSkill.trim() && !skills.find(s => s.name.toLowerCase() === newSkill.trim().toLowerCase())) {
      setSkills([...skills, { name: newSkill.trim(), endorsements: [] }]);
      setNewSkill('');
    }
  };

  const removeSkill = (name: string) => {
    setSkills(skills.filter(s => s.name !== name));
  };

  const endorseSkill = (name: string) => {
    if (!auth.currentUser || userRole !== 'mentor') return;
    
    setSkills(skills.map(s => {
      if (s.name === name) {
        // Prevent duplicate endorsements
        if (s.endorsements?.find(e => e.mentorUid === auth.currentUser?.uid)) return s;
        
        return {
          ...s,
          endorsements: [...(s.endorsements || []), {
            mentorUid: auth.currentUser.uid,
            mentorName: auth.currentUser.displayName || 'Mentor'
          }]
        };
      }
      return s;
    }));
  };

  const addJourneyItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (newJourney.title && newJourney.startDate) {
      const item: JourneyItem = {
        id: crypto.randomUUID(),
        type: newJourney.type as 'internship' | 'project' || 'internship',
        title: newJourney.title || '',
        organization: newJourney.organization || '',
        startDate: newJourney.startDate || '',
        endDate: newJourney.endDate || '',
        description: newJourney.description || ''
      };
      
      const updatedJourney = [...journey, item].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
      setJourney(updatedJourney);
      setNewJourney({ type: 'internship' });
      setShowAddJourney(false);
    }
  };

  const removeJourneyItem = (id: string) => {
    setJourney(journey.filter(j => j.id !== id));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    setSaving(true);
    setSuccess(false);
    
    try {
      // Update Firebase Auth
      await updateProfile(currentUser, {
        displayName: displayName,
        photoURL: photoURL
      });
      
      // Update Firestore user document
      await updateDoc(doc(db, 'users', currentUser.uid), {
        displayName: displayName,
        photoURL: photoURL,
        linkedIn: linkedIn,
        skills: skills,
        journey: journey
      });
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Error saving profile:", err);
      alert("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const verifyLinkedIn = async () => {
    if (!linkedIn) return;
    setLinkedInStatus('checking');
    try {
      const res = await fetch('/api/verify-linkedin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: linkedIn })
      });
      const data = await res.json();
      if (data.valid) {
        setLinkedInStatus('verified');
      } else {
        setLinkedInStatus('invalid');
      }
    } catch (err) {
      setLinkedInStatus('invalid');
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      setShowCamera(true);
      
      // Need a small timeout to let the video element render
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      }, 100);
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera. Please ensure you have granted permissions.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Draw the image onto the canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert to base64, with some compression
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setPhotoURL(dataUrl);
        stopCamera();
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
        <div className="bg-emerald-600 px-8 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-white">
            <h2 className="text-2xl font-bold">My Profile</h2>
            <p className="text-emerald-100 mt-1">Manage your personal details and connected accounts</p>
          </div>
          {userRole === 'student' && (
            <button
              onClick={openMentorshipModal}
              className="flex items-center gap-2 bg-white text-emerald-600 px-4 py-2 rounded-xl font-bold hover:bg-emerald-50 transition-colors shadow-sm"
            >
              <Users className="w-5 h-5" />
              Request Mentorship
            </button>
          )}
        </div>
        
        <form onSubmit={handleSave} className="p-8 space-y-8">
          {/* Profile Picture Section */}
          <div className="flex flex-col items-center space-y-4 pb-6 border-b border-gray-100">
            <div className="relative group">
              {photoURL ? (
                <img 
                  src={photoURL} 
                  alt="Profile" 
                  className="w-32 h-32 rounded-full object-cover border-4 border-emerald-50 shadow-md"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-emerald-50 border-4 border-emerald-100 flex items-center justify-center">
                  <User className="w-12 h-12 text-emerald-300" />
                </div>
              )}
              
              <button
                type="button"
                onClick={startCamera}
                className="absolute bottom-0 right-0 p-3 bg-emerald-600 text-white rounded-full shadow-lg hover:bg-emerald-700 transition-colors"
                title="Take Photo"
              >
                <Camera className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500 font-medium">Click the camera icon to take a new picture</p>
          </div>

          {/* Personal Details Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Personal Details</h3>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                  placeholder="John Doe"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={auth.currentUser?.email || ''}
                  disabled
                  className="w-full px-4 py-2 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Social Links Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Connected Accounts</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn Profile</label>
              <div className="flex flex-col sm:flex-row gap-3 items-start">
                <div className="relative flex-1 w-full">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Linkedin className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="url"
                    value={linkedIn}
                    onChange={(e) => {
                      setLinkedIn(e.target.value);
                      if (linkedInStatus !== 'idle') setLinkedInStatus('idle');
                    }}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>
                <button
                  type="button"
                  onClick={verifyLinkedIn}
                  disabled={!linkedIn || linkedInStatus === 'checking'}
                  className="whitespace-nowrap px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 h-[42px]"
                >
                  {linkedInStatus === 'checking' && <Loader2 className="w-4 h-4 animate-spin" />}
                  Verify Profile
                </button>
              </div>
              
              {linkedInStatus === 'verified' && (
                <p className="mt-2 text-sm text-emerald-600 flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  Verified: Public profile found
                </p>
              )}
              {linkedInStatus === 'invalid' && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1.5 font-medium">
                  <AlertCircle className="w-4 h-4" />
                  Could not verify profile. Please check the URL.
                </p>
              )}
            </div>
          </div>

          {/* Skills & Endorsements Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Skills & Endorsements</h3>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="Add a new skill (e.g. React, Python)"
                className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSkill();
                  }
                }}
              />
              <button
                type="button"
                onClick={addSkill}
                disabled={!newSkill.trim()}
                className="px-4 py-2 bg-emerald-100 text-emerald-700 font-bold rounded-xl hover:bg-emerald-200 transition-colors disabled:opacity-50"
              >
                Add Skill
              </button>
            </div>

            <div className="flex flex-wrap gap-3 mt-4">
              {skills.map((skill, index) => (
                <div key={index} className="flex flex-col gap-1 bg-white border border-gray-200 rounded-xl p-3 shadow-sm min-w-[180px]">
                  <div className="flex items-start justify-between gap-4">
                    <span className="font-bold text-gray-800">{skill.name}</span>
                    <button
                      type="button"
                      onClick={() => removeSkill(skill.name)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      title="Remove Skill"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {skill.endorsements && skill.endorsements.length > 0 ? (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {skill.endorsements.map((end, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-md border border-emerald-100">
                          <CheckCircle2 className="w-3 h-3" />
                          {end.mentorName}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">No endorsements yet</span>
                  )}

                  {userRole === 'mentor' && (!skill.endorsements || !skill.endorsements.find(e => e.mentorUid === auth.currentUser?.uid)) && (
                    <button
                      type="button"
                      onClick={() => endorseSkill(skill.name)}
                      className="mt-2 text-xs w-full py-1.5 bg-gray-50 text-gray-700 font-bold rounded-lg hover:bg-emerald-50 hover:text-emerald-700 transition-colors border border-gray-200"
                    >
                      Endorse Skill
                    </button>
                  )}
                </div>
              ))}
              {skills.length === 0 && (
                <p className="text-sm text-gray-500 italic">No skills added yet.</p>
              )}
            </div>
          </div>

          {/* Professional Journey Timeline */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Professional Journey</h3>
              {(userRole === 'student' || userRole === 'employee') && (
                <button
                  type="button"
                  onClick={() => setShowAddJourney(!showAddJourney)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-sm font-bold rounded-lg hover:bg-emerald-100 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  {showAddJourney ? 'Cancel' : 'Add Experience'}
                </button>
              )}
            </div>

            {showAddJourney && (
              <div className="p-5 bg-gray-50 border border-gray-200 rounded-xl space-y-4 mb-6">
                <h4 className="font-bold text-gray-800">Add New Experience</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                    <select
                      value={newJourney.type}
                      onChange={(e) => setNewJourney({...newJourney, type: e.target.value as 'internship' | 'project'})}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    >
                      <option value="internship">Internship / Work</option>
                      <option value="project">Project</option>
                    </select>
                  </div>
                  
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Title / Role *</label>
                    <input
                      type="text"
                      value={newJourney.title || ''}
                      onChange={(e) => setNewJourney({...newJourney, title: e.target.value})}
                      placeholder="e.g. Frontend Engineer Intern"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                      required
                    />
                  </div>
                  
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Organization / Company</label>
                    <input
                      type="text"
                      value={newJourney.organization || ''}
                      onChange={(e) => setNewJourney({...newJourney, organization: e.target.value})}
                      placeholder="e.g. Google"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  
                  <div className="col-span-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Start Date *</label>
                    <input
                      type="month"
                      value={newJourney.startDate || ''}
                      onChange={(e) => setNewJourney({...newJourney, startDate: e.target.value})}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                      required
                    />
                  </div>
                  
                  <div className="col-span-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="month"
                      value={newJourney.endDate || ''}
                      onChange={(e) => setNewJourney({...newJourney, endDate: e.target.value})}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                    <p className="text-[10px] text-gray-500 mt-1">Leave empty if present</p>
                  </div>
                  
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={newJourney.description || ''}
                      onChange={(e) => setNewJourney({...newJourney, description: e.target.value})}
                      placeholder="What did you do or accomplish?"
                      rows={3}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                    ></textarea>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={addJourneyItem}
                    disabled={!newJourney.title || !newJourney.startDate}
                    className="px-4 py-2 bg-gray-900 text-white text-sm font-bold rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                  >
                    Save Experience
                  </button>
                </div>
              </div>
            )}

            <div className="relative pl-4 sm:pl-6 border-l-2 border-gray-100 space-y-8">
              {journey.length > 0 ? journey.map((item) => (
                <div key={item.id} className="relative">
                  <div className="absolute -left-[25px] sm:-left-[33px] top-1 bg-white p-1 rounded-full border-2 border-gray-200">
                    <Briefcase className="w-4 h-4 text-emerald-600" />
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow group">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                      <div>
                        <h4 className="font-bold text-gray-900 text-lg">{item.title}</h4>
                        <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-600">
                          {item.organization && (
                            <span className="flex items-center gap-1">
                              <Building className="w-4 h-4" />
                              {item.organization}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {item.startDate} - {item.endDate || 'Present'}
                          </span>
                        </div>
                      </div>
                      
                      {auth.currentUser?.uid && (userRole === 'student' || userRole === 'employee') && (
                        <button
                          type="button"
                          onClick={() => removeJourneyItem(item.id)}
                          className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity absolute right-4 top-4"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    
                    {item.description && (
                      <p className="text-gray-600 text-sm mt-3 whitespace-pre-wrap">{item.description}</p>
                    )}
                    
                    <span className="inline-block mt-4 px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-md uppercase tracking-wide">
                      {item.type}
                    </span>
                  </div>
                </div>
              )) : (
                <div className="text-gray-500 italic py-4">No professional journey items added yet.</div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 flex items-center justify-between border-t border-gray-100">
            {success ? (
              <span className="flex items-center gap-2 text-emerald-600 font-medium">
                <CheckCircle2 className="w-5 h-5" />
                Profile updated successfully
              </span>
            ) : (
              <span /> // spacer
            )}
            
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-white rounded-2xl overflow-hidden shadow-2xl max-w-md w-full">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-900">Take Profile Picture</h3>
              <button onClick={stopCamera} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="relative bg-black aspect-video flex items-center justify-center">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline
                className="max-h-[60vh] w-full"
              />
              <canvas ref={canvasRef} className="hidden" />
            </div>
            
            <div className="p-4 bg-gray-50 flex justify-center">
              <button
                type="button"
                onClick={capturePhoto}
                className="bg-emerald-600 text-white px-8 py-3 rounded-full font-bold hover:bg-emerald-700 transition-colors shadow-lg hover:shadow-xl active:scale-95 flex items-center gap-2"
              >
                <Camera className="w-5 h-5" />
                Capture
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mentorship Modal */}
      {showMentorshipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-white rounded-2xl overflow-hidden shadow-2xl max-w-md w-full">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                Request Mentorship
              </h3>
              <button onClick={() => setShowMentorshipModal(false)} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {mentorshipSuccess ? (
                <div className="flex flex-col items-center justify-center py-6 text-emerald-600">
                  <CheckCircle2 className="w-16 h-16 mb-4" />
                  <h4 className="text-xl font-bold">Request Sent!</h4>
                  <p className="text-gray-500 text-center mt-2">The mentor has been notified and will review your request.</p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select a Mentor</label>
                    <select
                      value={selectedMentor}
                      onChange={(e) => setSelectedMentor(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                    >
                      <option value="">Choose someone...</option>
                      {mentors.map(m => (
                        <option key={m.uid} value={m.uid}>{m.displayName} ({m.email})</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message (Optional)</label>
                    <textarea
                      value={mentorshipMessage}
                      onChange={(e) => setMentorshipMessage(e.target.value)}
                      rows={4}
                      placeholder="Introduce yourself and explain what kind of guidance you are looking for..."
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none resize-none"
                    ></textarea>
                  </div>
                </>
              )}
            </div>
            
            {!mentorshipSuccess && (
              <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                <button
                  onClick={() => setShowMentorshipModal(false)}
                  className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRequestMentorship}
                  disabled={!selectedMentor || requestingMentorship}
                  className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {requestingMentorship ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  Send Request
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
