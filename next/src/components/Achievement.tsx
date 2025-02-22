import React, { useEffect, useState, Suspense } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type Spot = {
    id: number;
    name: string;
    lat: number;
    lon: number;
};

const Spots: React.FC = () => {
    const [spots, setSpots] = useState<Spot[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch("http://localhost:8080/spots");
                if (!res.ok) {
                    throw new Error("データの取得に失敗しました");
                }
                const data = await res.json();
                setSpots(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <p>読み込み中...</p>;

    return (
        <div>
            <h2>スポット一覧</h2>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>名前</TableHead>
                        <TableHead>緯度</TableHead>
                        <TableHead>経度</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {spots.map((spot) => (
                        <TableRow key={spot.id}>
                            <TableCell>{spot.name}</TableCell>
                            <TableCell>{spot.lat}</TableCell>
                            <TableCell>{spot.lon}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};

const Achievement: React.FC = () => {
    return (
        <div>
            <Suspense fallback={<p>読み込み中...</p>}>
                <Spots />
            </Suspense>
        </div>
    );
};

export default Achievement;
