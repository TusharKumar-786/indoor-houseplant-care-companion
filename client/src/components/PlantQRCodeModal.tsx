import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { QrCode, Download, Printer, Check, Droplets } from 'lucide-react';
import { useToast } from './Toast';
import api from '../api/client';
import { localDateString } from '../utils/date';

interface PlantQRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  plant: {
    id: number;
    nickname: string;
    species: string;
    room?: string | null;
  };
  onWatered?: () => void;
}

export const PlantQRCodeModal: React.FC<PlantQRCodeModalProps> = ({
  isOpen,
  onClose,
  plant,
  onWatered,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isWatering, setIsWatering] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (!isOpen || !plant?.id) return;

    // URL to plant detail or quick water action
    const plantUrl = `${window.location.origin}/plants/${plant.id}`;

    QRCode.toDataURL(plantUrl, {
      width: 320,
      margin: 2,
      color: {
        dark: '#1F3D2B', // Deep Moss
        light: '#F5F1E6', // Oat Cream
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Failed to generate QR code:', err));
  }, [isOpen, plant?.id]);

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `leafpulse-qr-${plant.nickname.toLowerCase().replace(/\s+/g, '-')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('Plant QR code downloaded');
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>${plant.nickname} – LeafPulse Tag</title>
          <style>
            body { font-family: system-ui, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #fff; text-align: center; }
            .card { border: 2px solid #1F3D2B; border-radius: 16px; padding: 24px; max-width: 280px; }
            h2 { margin: 8px 0 2px 0; color: #1F3D2B; font-size: 18px; }
            p { margin: 0 0 12px 0; color: #736159; font-size: 12px; }
            img { width: 200px; height: 200px; }
            .brand { margin-top: 12px; font-size: 11px; font-weight: bold; color: #3E7B52; text-transform: uppercase; letter-spacing: 1px; }
          </style>
        </head>
        <body>
          <div class="card">
            <img src="${qrDataUrl}" alt="${plant.nickname} QR Tag" />
            <h2>${plant.nickname}</h2>
            <p>${plant.species}${plant.room ? ' • ' + plant.room : ''}</p>
            <div class="brand">LeafPulse Garden Tag</div>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleQuickWater = async () => {
    try {
      setIsWatering(true);
      await api.post('/logs', {
        plant_id: plant.id,
        action: 'Watered',
        date: localDateString(),
        notes: 'Watered via plant QR tag scan',
      });
      showToast(`${plant.nickname} marked as watered`);
      if (onWatered) onWatered();
      onClose();
    } catch (err) {
      showToast('Failed to log watering', 'error');
    } finally {
      setIsWatering(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <QrCode className="w-5 h-5 text-[#3E7B52]" />
          <span>Botanical Care Tag</span>
        </div>
      }
      description={`Print or scan to quickly access ${plant.nickname}'s care record.`}
      maxWidth="sm"
    >
      <div className="space-y-5 text-center">
        {/* QR Code Container */}
        <div className="p-5 bg-white rounded-2xl border border-[#C9D8C5] shadow-xs inline-block mx-auto">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt={`${plant.nickname} QR Code`}
              className="w-48 h-48 mx-auto object-contain rounded-lg"
            />
          ) : (
            <div className="w-48 h-48 bg-[#ECE5D4] animate-pulse rounded-lg" />
          )}
          <div className="mt-3">
            <h4 className="font-serif font-bold text-base text-[#1F3D2B]">
              {plant.nickname}
            </h4>
            <p className="text-xs text-[#736159] italic mt-0.5">
              {plant.species}
            </p>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="space-y-2 pt-1">
          <Button
            type="button"
            variant="primary"
            className="w-full"
            isLoading={isWatering}
            onClick={handleQuickWater}
            icon={<Droplets className="w-4 h-4" />}
          >
            Mark as Watered Now
          </Button>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button
              type="button"
              variant="quiet"
              size="sm"
              onClick={handleDownload}
              icon={<Download className="w-3.5 h-3.5" />}
            >
              Download
            </Button>
            <Button
              type="button"
              variant="quiet"
              size="sm"
              onClick={handlePrint}
              icon={<Printer className="w-3.5 h-3.5" />}
            >
              Print Tag
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
