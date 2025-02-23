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
            <Table>
                <TableHeader>
                    <TableRow
                        style = {{backgroundColor: 'rgba(0, 0, 0, 0.1)'}}
                    >
                        <TableCell>スポットの名称</TableCell>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {spots.map((spot, index) => (
                        <TableRow
                            key={index} // インデックスをkeyとして使用
                            style={{ backgroundColor: spot.is_achieved ? 'rgba(0, 0, 255, 0.5)' : 'inherit' }}
                        >
                            <TableCell>{spot.name}</TableCell>
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
