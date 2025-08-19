import React, { useState, useCallback, useEffect } from 'react';
import { 
  Form, 
  Input, 
  Select, 
  DatePicker, 
  InputNumber, 
  Button, 
  Card, 
  message, 
  Space,
  Typography,
  Row,
  Col,
  Upload
} from 'antd';
import { 
  SaveOutlined, 
  ArrowLeftOutlined, 
  CalendarOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  FileTextOutlined,
  PlusOutlined,
  UploadOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const MeetingForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [communities, setCommunities] = useState([]);
  const [initialValues, setInitialValues] = useState({});
  const [fileList, setFileList] = useState([]);
  const [imageList, setImageList] = useState([]);
  const [selectedProject, setSelectedProject] = useState();

  const isEdit = !!id;

  const typeLabels = {
    group: '组',
    pai: '排',
    community: '小区',
    region: '大区',
    church: '召会',
  };

  // ✅ useCallback to make function stable for useEffect
  const fetchCommunities = useCallback(async () => {
    try {
      const response = await api.get('/api/communities');
      setCommunities(response.data);
    } catch (error) {
      console.error('获取小区列表失败:', error);
      message.error('获取小区列表失败');
    }
  }, []);

  const fetchMeetingData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/meetings/${id}`);
      const meeting = response.data;

      const formData = {
        ...meeting,
        meeting_date: dayjs(meeting.meeting_date),
        community_id: meeting.community_id
      };

      setInitialValues(formData);
      form.setFieldsValue(formData);
      if (meeting.project) {
        form.setFieldsValue({ project: meeting.project });
        setSelectedProject(meeting.project);
      }
    } catch (error) {
      console.error('获取聚会记录失败:', error);
      message.error('获取聚会记录失败');
      navigate('/meetings');
    } finally {
      setLoading(false);
    }
  }, [form, id, navigate]);

  useEffect(() => {
    fetchCommunities();
    if (isEdit) {
      fetchMeetingData();
    }
  }, [id, isEdit, fetchCommunities, fetchMeetingData]);

  const onFinish = async (values) => {
    try {
      setLoading(true);
      
      const formData = new FormData();
      formData.append('project', values.project);
      formData.append('community_id', values.community_id);
      formData.append('meeting_date', values.meeting_date.format('YYYY-MM-DD'));
      formData.append('meeting_time', values.meeting_time);
      formData.append('location', values.location || '');
      formData.append('participants_count', values.participants_count || 0);
      formData.append('notes', values.notes || '');

      // 添加图片文件
      imageList.forEach((file, index) => {
        if (file.originFileObj) {
          formData.append('images', file.originFileObj);
        }
      });

      // 添加其他文件
      fileList.forEach((file, index) => {
        if (file.originFileObj) {
          formData.append('files', file.originFileObj);
        }
      });

      if (isEdit) {
        await api.put(`/api/meetings/${id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        message.success('聚会记录更新成功');
      } else {
        await api.post('/api/meetings', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        message.success('聚会记录添加成功');
      }
      
      navigate('/meetings');
    } catch (error) {
      console.error('保存失败:', error);
      message.error(error.response?.data?.error || '保存失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/meetings');
  };

  const timeOptions = [
    '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
    '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30'
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>
          {isEdit ? '编辑聚会记录' : '添加聚会记录'}
        </Title>
      </div>

      <Card className="meeting-form">
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={initialValues}
          disabled={loading}
        >
          <Row gutter={[24, 0]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="project"
                label="项目"
                rules={[{ required: true, message: '请选择项目！' }]}
              >
                <Select
                  placeholder="选择项目（1~10）"
                  onChange={(value) => {
                    setSelectedProject(value);
                    form.setFieldsValue({ community_id: undefined });
                  }}
                >
                  {Array.from({ length: 10 }, (_, i) => `${i + 1}`).map(p => (
                    <Option key={p} value={p}>{p}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[24, 0]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="community_id"
                label="组/排/小区/大区/召会"
                rules={[{ required: true, message: '请选择组/排/小区/大区/召会！' }]}
              >
                <Select
                  placeholder="选择组/排/小区/大区/召会"
                  showSearch
                  optionFilterProp="children"
                  suffixIcon={<TeamOutlined />}
                  disabled={!selectedProject}
                >
                  {communities
                    .filter(community => !selectedProject || community.project === selectedProject)
                    .map(community => (
                      <Option key={community.id} value={community.id}>
                        {community.name}（{typeLabels[community.type]}，项目：{community.project}）
                      </Option>
                    ))}
                </Select>
              </Form.Item>
            </Col>
            
            <Col xs={24} md={12}>
              <Form.Item
                name="meeting_date"
                label="聚会日期"
                rules={[{ required: true, message: '请选择聚会日期！' }]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  placeholder="选择聚会日期"
                  suffixIcon={<CalendarOutlined />}
                  disabledDate={(current) => current && current > dayjs().endOf('day')}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[24, 0]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="meeting_time"
                label="聚会时间"
                rules={[{ required: true, message: '请选择聚会时间！' }]}
              >
                <Select
                  placeholder="选择聚会时间"
                  showSearch
                  optionFilterProp="children"
                >
                  {timeOptions.map(time => (
                    <Option key={time} value={time}>
                      {time}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            
            <Col xs={24} md={12}>
              <Form.Item
                name="participants_count"
                label="参与人数"
                rules={[
                  { required: true, message: '请输入参与人数！' },
                  { type: 'number', min: 0, message: '参与人数不能为负数！' }
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="输入参与人数"
                  min={0}
                  max={10000}
                  suffixIcon={<TeamOutlined />}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[24, 0]}>
            <Col span={24}>
              <Form.Item
                name="location"
                label="聚会地点"
                rules={[]}
              >
                <Input
                  placeholder="输入聚会地点"
                  suffixIcon={<EnvironmentOutlined />}
                  maxLength={200}
                  showCount
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[24, 0]}>
            <Col span={24}>
              <Form.Item
                name="notes"
                label="备注"
              >
                <TextArea
                  placeholder="输入备注信息（可选）"
                  suffixIcon={<FileTextOutlined />}
                  rows={4}
                  maxLength={500}
                  showCount
                />
              </Form.Item>
            </Col>
          </Row>

          {/* 图片上传 */}
          <Row gutter={[24, 0]}>
            <Col span={24}>
              <Form.Item label="聚会图片">
                <Upload
                  listType="picture-card"
                  fileList={imageList}
                  onChange={({ fileList }) => setImageList(fileList)}
                  beforeUpload={() => false}
                  accept="image/*"
                  maxCount={5}
                >
                  {imageList.length >= 5 ? null : (
                    <div>
                      <PlusOutlined />
                      <div style={{ marginTop: 8 }}>上传图片</div>
                    </div>
                  )}
                </Upload>
                <div style={{ color: '#666', fontSize: '12px', marginTop: 8 }}>
                  支持 JPG、PNG、GIF 格式，最多5张，每张不超过5MB
                </div>
              </Form.Item>
            </Col>
          </Row>

          {/* 文件上传 */}
          <Row gutter={[24, 0]}>
            <Col span={24}>
              <Form.Item label="相关文件">
                <Upload
                  fileList={fileList}
                  onChange={({ fileList }) => setFileList(fileList)}
                  beforeUpload={() => false}
                  maxCount={10}
                >
                  <Button icon={<UploadOutlined />}>上传文件</Button>
                </Upload>
                <div style={{ color: '#666', fontSize: '12px', marginTop: 8 }}>
                  支持 PDF、Word、Excel 等格式，最多10个文件，每个不超过10MB
                </div>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginTop: 32, marginBottom: 0 }}>
            <Space size="middle">
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={<SaveOutlined />}
                size="large"
              >
                {isEdit ? '更新' : '保存'}
              </Button>
              <Button
                onClick={handleCancel}
                icon={<ArrowLeftOutlined />}
                size="large"
              >
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default MeetingForm;
