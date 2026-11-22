import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '../components/ui/Logo';
import { Button } from '../components/ui/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F5F1E6] flex flex-col justify-between p-8 text-[#3B2F2A]">
      <div>
        <Link to="/" className="inline-block">
          <Logo textColor="#1F3D2B" size={34} />
        </Link>
      </div>

      <div className="max-w-md mx-auto text-center space-y-4">
        <span className="font-serif font-bold text-7xl text-[#1F3D2B]/20">
          404
        </span>
        <h1 className="text-3xl font-serif font-bold text-[#1F3D2B]">
          Off the Garden Path
        </h1>
        <p className="text-sm text-[#736159] leading-relaxed">
          The page you are looking for has been moved, repotted, or does not exist.
        </p>
        <div className="pt-2">
          <Link to="/">
            <Button variant="primary" icon={<ArrowLeft className="w-4 h-4" />}>
              Return to Garden
            </Button>
          </Link>
        </div>
      </div>

      <div className="text-center text-xs text-[#736159]">
        LeafPulse Indoor Plant Companion
      </div>
    </div>
  );
};
