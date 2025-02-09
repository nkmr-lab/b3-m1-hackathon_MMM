import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import EXIF from 'exif-js';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const TextComment: React.FC = () => {
  const [imageEncoded, setimageEncoded] = useState<string | null>(null);
  const [comment, setComment] = useState<string>('');
  const [exifData, setExifData] = useState<any>(null);
  const [gpsData, setGpsData] = useState<{ latitude: number | null, longitude: number | null }>({ latitude: null, longitude: null });
  const { user } = useAuth();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setimageEncoded(reader.result as string);

        // EXIF情報を取得
        EXIF.getData(file as any, function (this: any) {
          const allExifData = EXIF.getAllTags(this);
          setExifData(allExifData);

          // GPSデータの有無を確認し、取得
          if (allExifData.GPSLatitude && allExifData.GPSLongitude && allExifData.GPSLatitudeRef && allExifData.GPSLongitudeRef) {
            const convertDMSToDD = (degrees: number, minutes: number, seconds: number, direction: string) => {
              let dd = degrees + minutes / 60 + seconds / 3600;
              if (direction === 'S' || direction === 'W') {
                dd = dd * -1;
              }
              return dd;
            };

            const latitude = convertDMSToDD(
              allExifData.GPSLatitude[0], allExifData.GPSLatitude[1], allExifData.GPSLatitude[2], allExifData.GPSLatitudeRef
            );
            const longitude = convertDMSToDD(
              allExifData.GPSLongitude[0], allExifData.GPSLongitude[1], allExifData.GPSLongitude[2], allExifData.GPSLongitudeRef
            );
            setGpsData({ latitude, longitude });
          } else {
            setGpsData({ latitude: null, longitude: null });
            setimageEncoded(null);
            setExifData(null);
            toast.error('画像のGPS情報が見つかりませんでした');
          }
        });
      };
      reader.readAsDataURL(file);
    } else {
      setimageEncoded(null);
      setExifData(null);
      setGpsData({ latitude: null, longitude: null });
      toast.error('画像の読み込みに失敗しました');
    }
  };

  const handleSubmit = async () => {
    if (!exifData) {
      toast.error('画像が選択されていません');
      return;
    } else if (!comment) {
      toast.error('コメントが入力されていません');
      return;
    } else if (gpsData.latitude === null || gpsData.longitude === null) {
      toast.error('画像のGPS情報が見つかりませんでした');
      return;
    }

    const response = await fetch('http://localhost:8080/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: imageEncoded,
        user_id: user?.uid ?? "guest",
        gps_lat: gpsData.latitude,
        gps_lon: gpsData.longitude,
        comment: comment,
      }),
    });

    if (response.ok) {
      console.log("座標："+ gpsData.latitude + ", " + gpsData.longitude);
      toast.success('投稿しました');
      setimageEncoded(null);
      setComment('');
      setExifData(null);
      setGpsData({ latitude: null, longitude: null });

      window.location.href = '/feed'; // feedページに遷移
    } else {
      toast.error('投稿に失敗しました');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      {!imageEncoded ? (
        <>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            style={{ display: 'none' }}
            id="imageInput"
          />
          <Button onClick={() => document.getElementById('imageInput')?.click()}>
            画像を選択
          </Button>
        </>
      ) : (
        <>
          <Input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="コメントを入力"
            style={{ marginBottom: '10px' }}
          />
          <Button onClick={handleSubmit}>投稿</Button>
          <img src={imageEncoded} alt="Selected" style={{ marginTop: '10px', maxWidth: '100%' }} />
        </>
      )}
    </div>
  );
};

export default TextComment;