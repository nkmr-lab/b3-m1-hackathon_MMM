import React, { useEffect, useState, Suspense } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '../context/AuthContext';

type Spot = {
    id: number;
    name: string;
    lat: number;
    lon: number;
    is_achieved: boolean;
};

const Spots: React.FC = () => {
    const { user } = useAuth();
    const [spots, setSpots] = useState<Spot[]>([]);
    const [loading, setLoading] = useState(true);

    console.log(user?.uid);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`http://localhost:8080/spots-with-achievement?user_uid=${user?.uid ?? "guest"}`);
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
    }, [user]);

    if (loading) return <p>読み込み中...</p>;

    return (
        <div>
            <h2>スポット一覧</h2>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableCell>名前</TableCell>
                        <TableCell>緯度</TableCell>
                        <TableCell>経度</TableCell>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {spots.map((spot) => (
                        <TableRow key={spot.id} style={{ backgroundColor: spot.is_achieved ? 'red' : 'inherit' }}>
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
